import { VertexAI, HarmBlockThreshold, HarmCategory } from "@google-cloud/vertexai";
import { bufferToGenerativePart } from "@/lib/geoguess-image";
import { parseModelPredictionFromText, type ParsedModelPrediction } from "@/lib/geoguess-response";
import { createSafetySettings, GEOGUESS_GENERATION_CONFIG, GEOGUESS_PROMPT } from "@/lib/geoguess-prompt";
import type { GeoguessProvider } from "@/lib/geoguess-provider-config";

type GeoguessEnv = Record<string, string | undefined>;

export type GeoguessInferenceInput = {
  provider: GeoguessProvider;
  model: string;
  imageBuffer: Buffer;
  mimeType: string;
};

export type GeoguessInferenceResult = {
  provider: GeoguessProvider;
  model: string;
  prediction: ParsedModelPrediction;
  processingTimeMs: number;
};

export type InferenceDeps = {
  fetchImpl?: typeof fetch;
  env?: GeoguessEnv;
};

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

export function getGCPCredentials(env: GeoguessEnv = process.env): object {
  return env.GCP_PRIVATE_KEY && env.GCP_SERVICE_ACCOUNT_EMAIL && env.GCP_PROJECT_ID
    ? {
        credentials: {
          client_email: env.GCP_SERVICE_ACCOUNT_EMAIL,
          private_key: env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
      }
    : {};
}

async function inferWithOpenRouter(
  input: GeoguessInferenceInput,
  fetchImpl: typeof fetch,
  env: GeoguessEnv,
): Promise<string> {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const imageDataUrl = `data:${input.mimeType};base64,${input.imageBuffer.toString("base64")}`;
  const response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(env.OPENROUTER_SITE_URL ? { "HTTP-Referer": env.OPENROUTER_SITE_URL } : {}),
      ...(env.OPENROUTER_APP_NAME ? { "X-Title": env.OPENROUTER_APP_NAME } : {}),
    },
    body: JSON.stringify({
      model: input.model,
      temperature: GEOGUESS_GENERATION_CONFIG.temperature,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: GEOGUESS_PROMPT },
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

async function inferWithVertex(input: GeoguessInferenceInput, env: GeoguessEnv): Promise<string> {
  const projectId = env.GCP_PROJECT_ID;
  const location = env.VERTEXAI_LOCATION;
  if (!projectId || !location) {
    throw new Error("Vertex AI is not configured. Set GCP_PROJECT_ID and VERTEXAI_LOCATION.");
  }

  const imagePart = bufferToGenerativePart(input.imageBuffer, input.mimeType);
  const vertexAI = new VertexAI({
    project: projectId,
    location,
    googleAuthOptions: getGCPCredentials(env),
  });

  const generativeModel = vertexAI.getGenerativeModel({ model: input.model });
  const requestPayload = {
    contents: [{ role: "user", parts: [{ text: GEOGUESS_PROMPT }, imagePart] }],
    generationConfig: GEOGUESS_GENERATION_CONFIG,
    safetySettings: createSafetySettings(HarmCategory, HarmBlockThreshold),
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
  input: GeoguessInferenceInput,
  deps: Required<InferenceDeps>,
): Promise<string> {
  if (input.provider === "openrouter") {
    return inferWithOpenRouter(input, deps.fetchImpl, deps.env);
  }

  return inferWithVertex(input, deps.env);
}

export async function inferGeoguess(
  input: GeoguessInferenceInput,
  deps: InferenceDeps = {},
): Promise<GeoguessInferenceResult> {
  const resolvedDeps: Required<InferenceDeps> = {
    fetchImpl: deps.fetchImpl ?? fetch,
    env: deps.env ?? process.env,
  };

  const startedAt = Date.now();
  const responseText = await inferWithProvider(input, resolvedDeps);
  const prediction = parseModelPredictionFromText(responseText);

  return {
    provider: input.provider,
    model: input.model,
    prediction,
    processingTimeMs: Date.now() - startedAt,
  };
}
