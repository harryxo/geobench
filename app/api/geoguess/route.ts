import { VertexAI, HarmCategory, HarmBlockThreshold, Part } from '@google-cloud/vertexai';
import { NextRequest, NextResponse } from "next/server";
import { formatProcessingTime, parseModelPredictionFromText } from "@/lib/geoguess-response";
import {
  GeoguessProvider,
  resolveProviderAndModel,
  validateProviderEnv,
} from "@/lib/geoguess-provider-config";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

// Helper function to convert image buffer to Vertex AI Part (structure is compatible)
function fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// --- Define the getGCPCredentials helper function as shown in Vercel docs ---
// --- IMPORTANT: Added newline replacement for private_key ---
const getGCPCredentials = () => {
  // for Vercel, use environment variables
  return process.env.GCP_PRIVATE_KEY && process.env.GCP_SERVICE_ACCOUNT_EMAIL && process.env.GCP_PROJECT_ID
    ? {
        credentials: {
          client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
          // Replace escaped newlines from Vercel env var with actual newlines
          private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        // projectId: process.env.GCP_PROJECT_ID, // projectId is passed directly to VertexAI constructor
      }
      // for local development, use gcloud CLI (ADC)
    : {}; // Return empty object to let SDK use Application Default Credentials
};

const generationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 4096,
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const geoguessPrompt = `
  Analyze the provided image and identify the geographic location depicted.
  Respond ONLY with a JSON object containing the following keys:
  - "latitude": The estimated latitude (float or null).
  - "longitude": The estimated longitude (float or null).
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

function extractOpenRouterText(messageContent: unknown): string | null {
  if (typeof messageContent === "string") {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return null;
}

async function inferWithOpenRouter(imageBuffer: Buffer, mimeType: string, model: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: geoguessPrompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  const responseJson = await response.json();
  if (!response.ok) {
    const errorMessage =
      responseJson?.error?.message ||
      responseJson?.error ||
      `OpenRouter request failed with status ${response.status}`;
    throw new Error(String(errorMessage));
  }

  const content = responseJson?.choices?.[0]?.message?.content;
  const text = extractOpenRouterText(content);
  if (!text) {
    throw new Error("OpenRouter response missing text content.");
  }

  return text;
}

async function inferWithVertex(imageBuffer: Buffer, mimeType: string, model: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.VERTEXAI_LOCATION;
  if (!projectId || !location) {
    throw new Error("Vertex AI is not configured. Set GCP_PROJECT_ID and VERTEXAI_LOCATION.");
  }

  const imagePart = fileToGenerativePart(imageBuffer, mimeType);
  const authOptions = getGCPCredentials();
  const vertexAI = new VertexAI({
    project: projectId,
    location,
    googleAuthOptions: authOptions,
  });

  const generativeModel = vertexAI.getGenerativeModel({ model });
  const requestPayload = {
    contents: [{ role: "user", parts: [{ text: geoguessPrompt }, imagePart] }],
    generationConfig,
    safetySettings,
  };

  const streamingResp = await generativeModel.generateContentStream(requestPayload);
  const aggregatedResponse = await streamingResp.response;
  const responseText = aggregatedResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("Received no text content from Vertex AI model.");
  }

  return responseText;
}

async function inferWithProvider(
  provider: GeoguessProvider,
  model: string,
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (provider === "openrouter") {
    return inferWithOpenRouter(imageBuffer, mimeType, model);
  }
  return inferWithVertex(imageBuffer, mimeType, model);
}


export async function POST(req: NextRequest) {
  try {
    const requestStartedAt = Date.now();
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const providerInput = formData.get("provider");
    const modelInput = formData.get("model");

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Unsupported file type. Please upload an image." }, { status: 400 });
    }

    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image too large. Maximum file size is 10MB." }, { status: 400 });
    }

    const { provider, model } = resolveProviderAndModel(
      typeof providerInput === "string" ? providerInput : null,
      typeof modelInput === "string" ? modelInput : null,
    );
    const configError = validateProviderEnv(provider);
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";
    const responseText = await inferWithProvider(provider, model, imageBuffer, mimeType);

    try {
        const parsedResponse = parseModelPredictionFromText(responseText);
        const processingTimeMs = Date.now() - requestStartedAt;

        return NextResponse.json({
            provider,
            model,
            response: parsedResponse.reasoning,
            confidence: parsedResponse.confidence,
            coordinates:
              parsedResponse.latitude === null || parsedResponse.longitude === null
                ? null
                : {
                    lat: parsedResponse.latitude,
                    lng: parsedResponse.longitude,
                  },
            processingTime: formatProcessingTime(processingTimeMs),
            processingTimeMs
        });

    } catch (parseError) {
        console.error("Failed to parse model JSON response:", responseText, parseError);
        throw parseError;
    }

  } catch (error) {
    console.error("Error calling geoguess API:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to get response from model: ${errorMsg}` }, { status: 500 });
  }
}
