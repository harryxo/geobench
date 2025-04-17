import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const MODEL_NAME = "gemini-1.5-flash"; // Or "gemini-pro-vision", etc.
const API_KEY = process.env.GOOGLE_API_KEY;

// Helper function to convert image buffer to Gemini Part
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    // You could also pass the desired model name from the frontend if needed
    // const modelId = formData.get("modelId") as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imagePart = fileToGenerativePart(imageBuffer, imageFile.type);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Use the selected model

    const generationConfig = {
      temperature: 0.4, // Adjust as needed
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096, // Adjust as needed
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

      If you cannot determine a location, respond with null values for latitude and longitude and explain why in the reasoning.
    `;

    const parts = [prompt, imagePart];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    const responseText = result.response.text();

    // Attempt to parse the JSON response from the model
    try {
        const parsedResponse = JSON.parse(responseText);
        // Basic validation - check for null/undefined before accessing properties
        if (parsedResponse?.latitude == null || parsedResponse?.longitude == null || typeof parsedResponse?.reasoning !== 'string') {
             throw new Error("Invalid or incomplete JSON structure from model");
        }

        // TODO: Add more robust validation if needed

        return NextResponse.json({
            model: MODEL_NAME, // Or pass the actual modelId used
            response: parsedResponse.reasoning,
            confidence: parsedResponse.confidence || "N/A", // Handle missing confidence
            coordinates: {
                lat: parsedResponse.latitude,
                lng: parsedResponse.longitude,
            },
            // You might want to calculate accuracy and processing time here or later
            accuracy: "N/A", // Placeholder
            processingTime: "N/A" // Placeholder - could calculate time taken
        });

    } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText, parseError);
        // Return the raw text if parsing fails, or a structured error
        return NextResponse.json({
            model: MODEL_NAME,
            response: `Failed to parse model response: ${responseText}`,
            confidence: "N/A",
            coordinates: null,
            accuracy: "N/A",
            processingTime: "N/A",
            error: `Failed to parse model response: ${parseError instanceof Error ? parseError.message : String(parseError)}` // Include error detail
        }, { status: 500 }); // Indicate server-side issue
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to get response from model: ${errorMsg}` }, { status: 500 });
  }
}
