import type { ArenaModel } from "@/lib/arena-config";

export type GeoguessApiSuccess = {
  provider: string;
  model: string;
  response: string;
  confidence: string;
  coordinates: { lat: number; lng: number } | null;
  processingTime: string;
  processingTimeMs: number;
};

export async function requestModelGuess(imageFile: File, modelConfig: ArenaModel): Promise<GeoguessApiSuccess> {
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("provider", modelConfig.provider);
  formData.append("model", modelConfig.model);

  const response = await fetch("/api/geoguess", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = `API Error: ${errorBody.error || response.statusText}`;
    } catch {
      // Keep fallback error message.
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
