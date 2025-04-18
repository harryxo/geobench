import fs from 'fs/promises';
import path from 'path';
// Adjust import for CommonJS compatibility with @google-cloud/vertexai
import pkg from '@google-cloud/vertexai';
const { VertexAI, HarmCategory, HarmBlockThreshold } = pkg;
type Part = pkg.Part; // Explicitly type Part

// @ts-ignore - If @types/haversine-distance install fails again, uncomment this. Otherwise, remove it.
import haversine from 'haversine-distance';

// --- Configuration ---
// Ensure these are set in your environment (e.g., .env.local or export)
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const VERTEXAI_LOCATION = process.env.VERTEXAI_LOCATION;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // Added for Street View API
// GOOGLE_APPLICATION_CREDENTIALS should also be set in the environment

const VERTEX_MODEL_NAME = "gemini-2.5-pro-exp-03-25"; // Your target model

const DATASET_FILE = path.join(__dirname, '../benchmark_data/locations.json');
// IMAGE_DIR is no longer needed
// const IMAGE_DIR = path.join(__dirname, '../benchmark_data/images');
const OUTPUT_FILE = path.join(__dirname, '../benchmark_results.json'); // Where to save detailed results
const DISTANCE_THRESHOLD_KM = 100; // For accuracy calculation (e.g., correct if within 100km)
const STREETVIEW_IMAGE_WIDTH = 600;
const STREETVIEW_IMAGE_HEIGHT = 400;
const STREETVIEW_FOV = 90; // Field of View

// --- Types ---
// Updated LocationData structure
interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  heading?: number;
  pitch?: number;
  zoom?: number;
  panoId?: string | null; // Kept for consistency, but extra.panoId is primary
  countryCode?: string | null;
  stateCode?: string | null;
  extra?: {
    tags?: string[];
    panoId?: string; // The actual Pano ID we'll use
    panoDate?: string;
  };
}

interface ModelPrediction {
  latitude: number | null;
  longitude: number | null;
  reasoning: string;
  confidence: string;
  error?: string; // To capture errors during processing
}

interface BenchmarkResult extends LocationData {
  predicted: ModelPrediction;
  distanceKm: number | null; // Distance in kilometers
  isCorrect: boolean | null; // Based on threshold
  processingTimeMs?: number; // Optional: track time per image
}

// --- Vertex AI & Maps API Setup ---
if (!GCP_PROJECT_ID || !VERTEXAI_LOCATION) {
  console.error("Error: Vertex AI project ID or location not configured in environment variables (GCP_PROJECT_ID, VERTEXAI_LOCATION).");
  process.exit(1);
}
if (!GOOGLE_MAPS_API_KEY) {
  console.error("Error: Google Maps API Key not configured in environment variable (GOOGLE_MAPS_API_KEY).");
  process.exit(1);
}
// Note: GOOGLE_APPLICATION_CREDENTIALS is checked implicitly by the SDK

const vertex_ai = new VertexAI({ project: GCP_PROJECT_ID, location: VERTEXAI_LOCATION });
const generativeModel = vertex_ai.getGenerativeModel({
  model: VERTEX_MODEL_NAME,
});

const generationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 4096, // Keep reasonable for JSON output
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const prompt = `
  Analyze the provided image and identify the geographic location depicted.
  Respond ONLY with a valid JSON object containing the following keys:
  - "latitude": The estimated latitude (float).
  - "longitude": The estimated longitude (float).
  - "reasoning": A brief explanation (string).
  - "confidence": Your confidence level ("High", "Medium", "Low") (string).

  Example: {"latitude": 48.8584, "longitude": 2.2945, "reasoning": "Eiffel Tower.", "confidence": "High"}
  If unsure, use null for coordinates and explain in reasoning. Ensure the entire output is ONLY the JSON object.
`;

// --- Helper Functions ---
function imageBufferToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return { inlineData: { data: buffer.toString("base64"), mimeType } };
}

// Fetches Street View image and calls Vertex AI
async function getModelPredictionForPano(
    panoId: string,
    heading: number = 0,
    pitch: number = 0,
    fov: number = STREETVIEW_FOV
): Promise<ModelPrediction> {
  let imageBuffer: Buffer;
  const mimeType = 'image/jpeg'; // Street View API typically returns JPEG

  try {
    // --- Fetch image from Google Street View Image API ---
    const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=${STREETVIEW_IMAGE_WIDTH}x${STREETVIEW_IMAGE_HEIGHT}&pano=${panoId}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${GOOGLE_MAPS_API_KEY}`;

    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      // Attempt to get error reason from Google's response if possible
      let errorReason = `HTTP error ${imageResponse.status}`;
      if (imageResponse.headers.get('content-type')?.includes('text')) {
          errorReason += `: ${await imageResponse.text()}`;
      }
      throw new Error(`Failed to fetch Street View image for panoId ${panoId}. ${errorReason}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);

  } catch (fetchError: any) {
    console.error(`Error fetching Street View image for panoId ${panoId}:`, fetchError.message);
    return { // Return error state if image fetch fails
      latitude: null, longitude: null, reasoning: "", confidence: "N/A",
      error: `Street View Image Fetch Error: ${fetchError.message}`
    };
  }

  // --- Call Vertex AI with the fetched image ---
  try {
    const imagePart = imageBufferToGenerativePart(imageBuffer, mimeType);

    const requestPayload = {
      contents: [{ role: "user", parts: [{ text: prompt }, imagePart] }],
      generationConfig,
      safetySettings,
    };

    const response = await generativeModel.generateContent(requestPayload);
    const responseText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.warn(`Warning: Received no text content from Vertex AI model for panoId ${panoId}. Response: ${JSON.stringify(response.response)}`);
      throw new Error("Received no text content from Vertex AI model.");
    }

    // --- JSON Parsing ---
    let jsonString = responseText.trim();
    const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```|({[\s\S]*})/;
    const match = jsonString.match(jsonRegex);
    const extractedJson = match ? (match[1] || match[2]) : jsonString;

    if (!extractedJson) {
       throw new Error(`Could not extract JSON object from model response. Raw output: ${responseText}`);
    }
    jsonString = extractedJson.trim();

    if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        throw new Error(`Extracted content does not appear to be a valid JSON object. Extracted: ${jsonString}. Raw output: ${responseText}`);
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.latitude === undefined || parsed.longitude === undefined || typeof parsed.reasoning !== 'string' || typeof parsed.confidence !== 'string') {
         throw new Error(`Incomplete JSON structure: ${jsonString}`);
      }
      const lat = parsed.latitude === null ? null : (typeof parsed.latitude === 'number' ? parsed.latitude : parseFloat(parsed.latitude));
      const lon = parsed.longitude === null ? null : (typeof parsed.longitude === 'number' ? parsed.longitude : parseFloat(parsed.longitude));

      if (parsed.latitude !== null && isNaN(lat)) throw new Error(`Invalid latitude value: ${parsed.latitude}`);
      if (parsed.longitude !== null && isNaN(lon)) throw new Error(`Invalid longitude value: ${parsed.longitude}`);

      return { latitude: lat, longitude: lon, reasoning: parsed.reasoning, confidence: parsed.confidence };
    } catch (parseError: any) {
      throw new Error(`Failed to parse JSON: ${parseError.message}. Attempted to parse: ${jsonString}. Raw model output: ${responseText}`);
    }
  } catch (vertexError: any) {
    console.error(`Error calling Vertex AI for panoId ${panoId}:`, vertexError.message);
    return { // Return error state for Vertex AI errors
      latitude: null, longitude: null, reasoning: "", confidence: "N/A",
      error: `Vertex AI Error: ${vertexError.message}`
    };
  }
}

// --- Main Benchmark Execution ---
async function runBenchmark() {
  console.log(`Starting benchmark for ${VERTEX_MODEL_NAME}...`);
  console.log(`Loading dataset from: ${DATASET_FILE}`);

  let dataset: LocationData[];
  try {
      const datasetContent = await fs.readFile(DATASET_FILE, 'utf-8');
      dataset = JSON.parse(datasetContent);
      if (!Array.isArray(dataset)) throw new Error("Dataset file is not a JSON array.");
  } catch (err: any) {
      console.error(`Error reading or parsing dataset file ${DATASET_FILE}: ${err.message}`);
      process.exit(1);
  }

  console.log(`Found ${dataset.length} locations in dataset.`);
  // console.log(`Image directory: ${IMAGE_DIR}`); // No longer needed
  console.log(`Output file: ${OUTPUT_FILE}`);

  // Image directory check is no longer needed

  const results: BenchmarkResult[] = [];
  let processedCount = 0;

  for (const location of dataset) {
    processedCount++;
    const panoId = location.extra?.panoId; // Use the panoId from the 'extra' field

    if (!panoId) {
        console.warn(`Skipping location ${processedCount}/${dataset.length} ('${location.name}') due to missing panoId in 'extra' field.`);
        // Optionally push a result indicating the skip
        results.push({
            ...location,
            predicted: { latitude: null, longitude: null, reasoning: "", confidence: "N/A", error: "Skipped: Missing panoId" },
            distanceKm: null,
            isCorrect: null,
        });
        continue; // Skip to the next location
    }

    console.log(`Processing location ${processedCount}/${dataset.length}: ${location.name} (Pano ID: ${panoId})`);

    // Mime type is determined by Street View API, usually jpeg
    // let mimeType = 'image/jpeg';

    const startTime = Date.now();
    // Call the new function that handles fetching and prediction
    const prediction = await getModelPredictionForPano(
        panoId,
        location.heading,
        location.pitch
        // FOV is using the default from config
    );
    const endTime = Date.now();

    let distanceKm: number | null = null;
    let isCorrect: boolean | null = null;

    // Calculate distance using the ground truth lat/lng from the JSON
    if (prediction.latitude !== null && prediction.longitude !== null && prediction.error === undefined) {
      const trueCoords = { latitude: location.latitude, longitude: location.longitude };
      const predictedCoords = { latitude: prediction.latitude, longitude: prediction.longitude };
      distanceKm = haversine(trueCoords, predictedCoords) / 1000;
      isCorrect = distanceKm <= DISTANCE_THRESHOLD_KM;
    } else if (prediction.error) {
        console.log(` -> Failed: ${prediction.error}`);
    } else {
        console.log(` -> Model returned null coordinates.`);
    }

    results.push({
      ...location,
      predicted: prediction,
      distanceKm: distanceKm,
      isCorrect: isCorrect,
      processingTimeMs: endTime - startTime,
    });

    // Optional: Add a small delay to avoid hitting rate limits (Street View API also has limits)
    await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
  }

  // --- Calculate Summary Statistics ---
  const attemptedPredictions = results.length;
  // Filter out skipped results before calculating stats based on processing
  const processedResults = results.filter(r => r.predicted.error !== "Skipped: Missing panoId");
  const validResults = processedResults.filter(r => r.predicted.error === undefined); // Predictions where the script didn't encounter an error
  const successfulApiResponses = validResults.length; // Got a response, even if null coords
  const failedApiOrProcessing = processedResults.length - successfulApiResponses;

  // Filter further for results where the model provided coordinates
  const resultsWithCoords = validResults.filter(r => r.distanceKm !== null);
  const predictionsWithCoordsCount = resultsWithCoords.length;
  const correctPredictions = resultsWithCoords.filter(r => r.isCorrect).length;

  const averageDistance = predictionsWithCoordsCount > 0
    ? resultsWithCoords.reduce((sum, r) => sum + r.distanceKm!, 0) / predictionsWithCoordsCount
    : null;

  // Accuracy calculations adjusted to consider only processed results
  const overallAccuracy = processedResults.length > 0
    ? (correctPredictions / processedResults.length) * 100
    : 0;
  const processingAccuracy = successfulApiResponses > 0
    ? (correctPredictions / successfulApiResponses) * 100
    : 0;
  const predictionAccuracy = predictionsWithCoordsCount > 0
    ? (correctPredictions / predictionsWithCoordsCount) * 100
    : 0;

  console.log("\n--- Benchmark Summary ---");
  console.log(`Model: ${VERTEX_MODEL_NAME}`);
  console.log(`Total Locations in Dataset: ${attemptedPredictions}`);
  console.log(`Locations Processed (with PanoID): ${processedResults.length}`);
  console.log(`Successful API Responses / Processing: ${successfulApiResponses}`);
  console.log(`Failed API Calls / Processing Errors: ${failedApiOrProcessing}`);
  console.log(`Predictions with Coordinates Returned: ${predictionsWithCoordsCount}`);
  console.log(`Correct Predictions (within ${DISTANCE_THRESHOLD_KM}km): ${correctPredictions}`);
  console.log(`\nAccuracy (Correct / Processed Locations): ${overallAccuracy.toFixed(2)}%`);
  console.log(`Accuracy (Correct / Successful Responses): ${processingAccuracy.toFixed(2)}%`);
  console.log(`Accuracy (Correct / Predictions with Coords): ${predictionAccuracy.toFixed(2)}%`);
  console.log(`Average Distance (for predictions with coords): ${averageDistance !== null ? averageDistance.toFixed(2) + ' km' : 'N/A'}`);

  // --- Save Detailed Results ---
  try {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));
      console.log(`\nDetailed results saved to: ${OUTPUT_FILE}`);
  } catch (writeErr: any) {
      console.error(`Error writing results file ${OUTPUT_FILE}: ${writeErr.message}`);
  }
}

// --- Run the script ---
runBenchmark().catch(err => {
  console.error("Benchmark script failed:", err);
  process.exit(1);
});
