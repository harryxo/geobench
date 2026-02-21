import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function for ESM __dirname equivalent
// Adjust import for CommonJS compatibility with @google-cloud/vertexai
import pkg from '@google-cloud/vertexai';
const { VertexAI, HarmCategory, HarmBlockThreshold } = pkg;
type Part = pkg.Part; // Explicitly type Part

// @ts-ignore - If @types/haversine-distance install fails again, uncomment this. Otherwise, remove it.
import haversine from 'haversine-distance';
import { parseModelPredictionFromText } from '../lib/geoguess-response';
import { createSafetySettings, GEOGUESS_GENERATION_CONFIG, GEOGUESS_PROMPT } from '../lib/geoguess-prompt';
import { bufferToGenerativePart } from '../lib/geoguess-image';
import { buildBenchmarkSummary, computeDistanceKm } from '../lib/geoguess-metrics';

// --- Configuration ---
// Get the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const safetySettings = createSafetySettings(HarmCategory, HarmBlockThreshold);

// --- Helper Functions ---
function imageBufferToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return bufferToGenerativePart(buffer, mimeType);
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
      contents: [{ role: "user", parts: [{ text: GEOGUESS_PROMPT }, imagePart] }],
      generationConfig: GEOGUESS_GENERATION_CONFIG,
      safetySettings,
    };

    const response = await generativeModel.generateContent(requestPayload);
    const responseText = response.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.warn(`Warning: Received no text content from Vertex AI model for panoId ${panoId}. Response: ${JSON.stringify(response.response)}`);
      throw new Error("Received no text content from Vertex AI model.");
    }

    try {
      const parsed = parseModelPredictionFromText(responseText);
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        reasoning: parsed.reasoning,
        confidence: parsed.confidence,
      };
    } catch (parseError: any) {
      throw new Error(`Failed to parse model response: ${parseError.message}`);
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
      distanceKm = computeDistanceKm(haversine(trueCoords, predictedCoords));
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
  const summary = buildBenchmarkSummary({
    totalResults: attemptedPredictions,
    outcomes: results.map((r) => ({
      predictedError: r.predicted.error,
      distanceKm: r.distanceKm,
      isCorrect: r.isCorrect,
    })),
  });

  console.log("\n--- Benchmark Summary ---");
  console.log(`Model: ${VERTEX_MODEL_NAME}`);
  console.log(`Total Locations in Dataset: ${attemptedPredictions}`);
  console.log(`Locations Processed (with PanoID): ${summary.processedCount}`);
  console.log(`Successful API Responses / Processing: ${summary.successfulCount}`);
  console.log(`Failed API Calls / Processing Errors: ${summary.failedCount}`);
  console.log(`Predictions with Coordinates Returned: ${summary.withCoordsCount}`);
  console.log(`Correct Predictions (within ${DISTANCE_THRESHOLD_KM}km): ${summary.correctCount}`);
  console.log(`\nAccuracy (Correct / Processed Locations): ${summary.overallAccuracy.toFixed(2)}%`);
  console.log(`Accuracy (Correct / Successful Responses): ${summary.processingAccuracy.toFixed(2)}%`);
  console.log(`Accuracy (Correct / Predictions with Coords): ${summary.predictionAccuracy.toFixed(2)}%`);
  console.log(`Average Distance (for predictions with coords): ${summary.averageDistanceKm !== null ? summary.averageDistanceKm.toFixed(2) + ' km' : 'N/A'}`);

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
