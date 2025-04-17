import { VertexAI, HarmCategory, HarmBlockThreshold, Part } from '@google-cloud/vertexai';
import { NextRequest, NextResponse } from "next/server";

// --- Configuration from environment variables ---
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const VERTEXAI_LOCATION = process.env.VERTEXAI_LOCATION;
// GOOGLE_APPLICATION_CREDENTIALS should be set in the environment for authentication

// --- The specific Vertex AI model you requested ---
const VERTEX_MODEL_NAME = "gemini-2.5-pro-exp-03-25";

// Helper function to convert image buffer to Vertex AI Part (structure is compatible)
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

export async function POST(req: NextRequest) {
  // --- Check for necessary Vertex AI config ---
  if (!GCP_PROJECT_ID || !VERTEXAI_LOCATION) {
    return NextResponse.json({ error: "Vertex AI project ID or location not configured in environment variables." }, { status: 500 });
  }
  // The SDK will implicitly check for GOOGLE_APPLICATION_CREDENTIALS

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imagePart = fileToGenerativePart(imageBuffer, imageFile.type);

    // --- Initialize Vertex AI ---
    const vertex_ai = new VertexAI({ project: GCP_PROJECT_ID, location: VERTEXAI_LOCATION });

    // --- Instantiate the Model ---
    const generativeModel = vertex_ai.getGenerativeModel({
      model: VERTEX_MODEL_NAME,
      // Safety settings and generation config are passed during the generateContent call
    });

    const generationConfig = {
      temperature: 0.4, // Adjust as needed
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096, // Adjust as needed
      // candidateCount: 1 // Usually default, explicitly set if needed
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const prompt = `
      Analyze the provided image and identify the geographic location depicted.
      Respond ONLY with a JSON object containing the following keys:
      - "latitude": The estimated latitude (float).
      - "longitude": The estimated longitude (float).
      - "reasoning": A brief explanation of how you identified the location (string).
      - "confidence": Your confidence level (e.g., "High", "Medium", "Low") (string).

      Example Response:
      {
        "latitude": 48.8584,
        "longitude": 2.2945,
        "reasoning": "The image clearly shows the Eiffel Tower in Paris, France.",
        "confidence": "High"
      }

      If you cannot determine a location, respond with null values for latitude and longitude and explain why in the reasoning. Ensure the entire output is valid JSON.
    `;

    const requestPayload = {
        contents: [{ role: "user", parts: [ {text: prompt}, imagePart] }], // Combine prompt text and image part
        generationConfig,
        safetySettings,
    };

    // --- Call Vertex AI ---
    const streamingResp = await generativeModel.generateContentStream(requestPayload);
    // Aggregate the response from the stream
    const aggregatedResponse = await streamingResp.response;

    // --- Safely access the response text ---
    const responseText = aggregatedResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        console.error("Vertex AI response missing text content:", JSON.stringify(aggregatedResponse, null, 2));
        throw new Error("Received no text content from Vertex AI model.");
    }

    // --- Attempt to parse the JSON response from the model ---
    try {
        const parsedResponse = JSON.parse(responseText);

        // Basic validation - check for null/undefined before accessing properties
        // Use == null to check for both null and undefined
        if (parsedResponse?.latitude == null || parsedResponse?.longitude == null || typeof parsedResponse?.reasoning !== 'string') {
             throw new Error(`Invalid or incomplete JSON structure from model: ${responseText}`);
        }

        // TODO: Add more robust validation if needed

        return NextResponse.json({
            model: VERTEX_MODEL_NAME, // Identify the model used
            response: parsedResponse.reasoning,
            confidence: parsedResponse.confidence || "N/A", // Handle missing confidence
            coordinates: {
                lat: parsedResponse.latitude,
                lng: parsedResponse.longitude,
            },
            accuracy: "N/A", // Placeholder
            processingTime: "N/A" // Placeholder
        });

    } catch (parseError) {
        console.error("Failed to parse Vertex AI JSON response:", responseText, parseError);
        return NextResponse.json({
            model: VERTEX_MODEL_NAME,
            response: `Failed to parse model response. Raw output: ${responseText}`,
            confidence: "N/A",
            coordinates: null,
            accuracy: "N/A",
            processingTime: "N/A",
            error: `Failed to parse model response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        }, { status: 500 });
    }

  } catch (error) {
    console.error("Error calling Vertex AI API:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    // Check for specific authentication errors if possible
    if (errorMsg.includes("Could not load the default credentials")) {
         return NextResponse.json({ error: `Authentication Error: Could not load GCP credentials. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly in .env.local and points to a valid key file. Details: ${errorMsg}` }, { status: 500 });
    }
    return NextResponse.json({ error: `Failed to get response from Vertex AI model: ${errorMsg}` }, { status: 500 });
  }
}
