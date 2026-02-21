export interface ParsedModelPrediction {
  latitude: number | null;
  longitude: number | null;
  reasoning: string;
  confidence: string;
}

const JSON_RESPONSE_REGEX = /```(?:json)?\s*({[\s\S]*?})\s*```|({[\s\S]*})/;

function normalizeCoordinate(value: unknown, fieldName: "latitude" | "longitude"): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    if (Number.isNaN(value)) {
      throw new Error(`Invalid ${fieldName} value: NaN`);
    }
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid ${fieldName} value: ${value}`);
    }
    return parsed;
  }

  throw new Error(`Invalid ${fieldName} value type: ${typeof value}`);
}

export function extractJsonObject(responseText: string): string | null {
  const trimmed = responseText.trim();
  const regexMatch = trimmed.match(JSON_RESPONSE_REGEX);

  if (regexMatch) {
    return (regexMatch[1] || regexMatch[2] || "").trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
}

export function parseModelPredictionFromText(responseText: string): ParsedModelPrediction {
  const jsonString = extractJsonObject(responseText);

  if (!jsonString) {
    throw new Error(`Could not extract JSON object from model response. Raw output: ${responseText}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Failed to parse model response: ${
        error instanceof Error ? error.message : String(error)
      }. Attempted to parse: ${jsonString}. Raw output: ${responseText}`,
    );
  }

  const reasoning = parsed.reasoning;
  if (typeof reasoning !== "string") {
    throw new Error(`Invalid or missing reasoning in model response: ${jsonString}`);
  }

  const confidence = parsed.confidence;
  if (confidence !== undefined && typeof confidence !== "string") {
    throw new Error(`Invalid confidence value in model response: ${jsonString}`);
  }

  const latitude = normalizeCoordinate(parsed.latitude, "latitude");
  const longitude = normalizeCoordinate(parsed.longitude, "longitude");

  return {
    latitude,
    longitude,
    reasoning,
    confidence: typeof confidence === "string" ? confidence : "N/A",
  };
}

export function formatProcessingTime(ms: number): string {
  const normalized = Math.max(0, Math.round(ms));
  return `${normalized} ms`;
}
