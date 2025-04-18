import fs from 'fs/promises';
import path from 'path';
import { VertexAI, HarmCategory, HarmBlockThreshold, Part } from '@google-cloud/vertexai';
import haversine from 'haversine-distance'; // Using the example library

// --- Configuration ---
// Ensure these are set in your environment (e.g., .env.local or export)
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const VERTEXAI_LOCATION = process.env.VERTEXAI_LOCATION;
// GOOGLE_APPLICATION_CREDENTIALS should also be set in the environment

const VERTEX_MODEL_NAME = "gemini-2.5-pro-exp-03-25"; // Your target model

const DATASET_FILE = path.join(__dirname, '../benchmark_data/locations.json');
const IMAGE_DIR = path.join(__dirname, '../benchmark_data/images');
const OUTPUT_FILE = path.join(__dirname, '../benchmark_results.json'); // Where to save detailed results
const DISTANCE_THRESHOLD_KM = 100; // For accuracy calculation (e.g., correct if within 100km)

// --- Types ---
interface LocationData {
  filename: string;
  latitude: number;
  longitude: number;
  description?: string;
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

// --- Vertex AI Setup ---
if (!GCP_PROJECT_ID || !VERTEXAI_LOCATION) {
  console.error("Error: Vertex AI project ID or location not configured in environment variables (GCP_PROJECT_ID, VERTEXAI_LOCATION).");
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
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return { inlineData: { data: buffer.toString("base64"), mimeType } };
}

async function getModelPrediction(imagePath: string, imageMimeType: string): Promise<ModelPrediction> {
  try {
    // Check if image file exists before reading
    try {
        await fs.access(imagePath);
    } catch (accessError) {
        throw new Error(`Image file not found at path: ${imagePath}`);
    }

    const imageBuffer = await fs.readFile(imagePath);
    const imagePart = fileToGenerativePart(imageBuffer, imageMimeType);

    const requestPayload = {
      contents: [{ role: "user", parts: [{ text: prompt }, imagePart] }],
      generationConfig,
      safetySettings,
    };

    // Use generateContent for simpler non-streaming case in a script
    const response = await generativeModel.generateContent(requestPayload);

    const responseText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.warn(`Warning: Received no text content from Vertex AI model for ${path.basename(imagePath)}. Response: ${JSON.stringify(response.response)}`);
      throw new Error("Received no text content from Vertex AI model.");
    }

    // --- JSON Parsing (reuse robust logic from your API route) ---
    let jsonString = responseText.trim();
    const jsonRegex = /```(?:json)?\s*({[\s\S]*?})\s*```|({[\s\S]*})/; // Use non-greedy match for content within ```
    const match = jsonString.match(jsonRegex);
    // Prioritize captured group 1 (within ```json), then group 2 (within ```), then assume raw JSON
    const extractedJson = match ? (match[1] || match[2]) : jsonString;

    if (!extractedJson) {
       // This case should be rare now as we default to jsonString if no ``` found
       throw new Error(`Could not extract JSON object from model response. Raw output: ${responseText}`);
    }
    jsonString = extractedJson.trim();

    // Handle potential leading/trailing commas or other invalid chars if regex is imperfect
    // A simple check: must start with { and end with }
    if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        throw new Error(`Extracted content does not appear to be a valid JSON object. Extracted: ${jsonString}. Raw output: ${responseText}`);
    }


    try {
      const parsed = JSON.parse(jsonString);
      // Basic validation
      if (parsed.latitude === undefined || parsed.longitude === undefined || typeof parsed.reasoning !== 'string' || typeof parsed.confidence !== 'string') {
         throw new Error(`Incomplete JSON structure: ${jsonString}`);
      }
      // Allow null coordinates, ensure they are numbers if not null
      const lat = parsed.latitude === null ? null : (typeof parsed.latitude === 'number' ? parsed.latitude : parseFloat(parsed.latitude));
      const lon = parsed.longitude === null ? null : (typeof parsed.longitude === 'number' ? parsed.longitude : parseFloat(parsed.longitude));

      // Validate parsed numbers if they weren't null
      if (parsed.latitude !== null && isNaN(lat)) throw new Error(`Invalid latitude value: ${parsed.latitude}`);
      if (parsed.longitude !== null && isNaN(lon)) throw new Error(`Invalid longitude value: ${parsed.longitude}`);


      return {
        latitude: lat,
        longitude: lon,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
      };
    } catch (parseError: any) {
      throw new Error(`Failed to parse JSON: ${parseError.message}. Attempted to parse: ${jsonString}. Raw model output: ${responseText}`);
    }
  } catch (error: any) {
    console.error(`Error processing ${path.basename(imagePath)}:`, error.message);
    return { // Return error state
      latitude: null,
      longitude: null,
      reasoning: "",
      confidence: "N/A",
      error: error.message,
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


  console.log(`Found ${dataset.length} images in dataset.`);
  console.log(`Image directory: ${IMAGE_DIR}`);
  console.log(`Output file: ${OUTPUT_FILE}`);

  // Check if image directory exists
  try {
      await fs.access(IMAGE_DIR);
  } catch {
      console.warn(`Warning: Image directory ${IMAGE_DIR} not found. Please create it and add your benchmark images.`);
      // Decide if you want to exit or continue (maybe useful for testing script logic without images)
      // process.exit(1);
  }


  const results: BenchmarkResult[] = [];
  let processedCount = 0;

  for (const location of dataset) {
    processedCount++;
    console.log(`Processing image ${processedCount}/${dataset.length}: ${location.filename}`);
    const imagePath = path.join(IMAGE_DIR, location.filename);

    // Basic mime type detection (improve if needed for more types like webp)
    let mimeType = 'image/jpeg'; // Default
    if (location.filename.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
    } else if (location.filename.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
    } else if (location.filename.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif'; // Add other types if necessary
    }


    const startTime = Date.now();
    const prediction = await getModelPrediction(imagePath, mimeType);
    const endTime = Date.now();

    let distanceKm: number | null = null;
    let isCorrect: boolean | null = null;

    if (prediction.latitude !== null && prediction.longitude !== null && prediction.error === undefined) {
      const trueCoords = { latitude: location.latitude, longitude: location.longitude };
      const predictedCoords = { latitude: prediction.latitude, longitude: prediction.longitude };
      // haversine returns distance in meters
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

    // Optional: Add a small delay to avoid hitting rate limits if necessary
    // await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  }

  // --- Calculate Summary Statistics ---
  const validResults = results.filter(r => r.predicted.error === undefined); // Predictions where the script didn't encounter an error
  const attemptedPredictions = results.length;
  const successfulApiResponses = validResults.length; // Got a response, even if null coords
  const failedApiOrProcessing = attemptedPredictions - successfulApiResponses;

  // Filter further for results where the model provided coordinates
  const resultsWithCoords = validResults.filter(r => r.distanceKm !== null);
  const predictionsWithCoordsCount = resultsWithCoords.length;
  const correctPredictions = resultsWithCoords.filter(r => r.isCorrect).length;


  const averageDistance = predictionsWithCoordsCount > 0
    ? resultsWithCoords.reduce((sum, r) => sum + r.distanceKm!, 0) / predictionsWithCoordsCount
    : null;

  // Accuracy can be defined in different ways:
  // 1. % of *all* images correctly identified (within threshold)
  const overallAccuracy = attemptedPredictions > 0
    ? (correctPredictions / attemptedPredictions) * 100
    : 0;
  // 2. % of *successfully processed* images correctly identified
  const processingAccuracy = successfulApiResponses > 0
    ? (correctPredictions / successfulApiResponses) * 100
    : 0;
   // 3. % of images where *coordinates were returned* that were correct
  const predictionAccuracy = predictionsWithCoordsCount > 0
    ? (correctPredictions / predictionsWithCoordsCount) * 100
    : 0;


  console.log("\n--- Benchmark Summary ---");
  console.log(`Model: ${VERTEX_MODEL_NAME}`);
  console.log(`Total Images Attempted: ${attemptedPredictions}`);
  console.log(`Successful API Responses / Processing: ${successfulApiResponses}`);
  console.log(`Failed API Calls / Processing Errors: ${failedApiOrProcessing}`);
  console.log(`Predictions with Coordinates Returned: ${predictionsWithCoordsCount}`);
  console.log(`Correct Predictions (within ${DISTANCE_THRESHOLD_KM}km): ${correctPredictions}`);
  console.log(`\nAccuracy (Correct / Total Attempted): ${overallAccuracy.toFixed(2)}%`);
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
