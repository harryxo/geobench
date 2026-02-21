import { NextRequest, NextResponse } from "next/server";
import { formatProcessingTime } from "@/lib/geoguess-response";
import {
  resolveProviderAndModel,
  validateProviderEnv,
} from "@/lib/geoguess-provider-config";
import { inferGeoguess } from "@/lib/geoguess-inference";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;


export async function POST(req: NextRequest) {
  try {
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
    const inference = await inferGeoguess({
      provider,
      model,
      imageBuffer,
      mimeType,
    });

    return NextResponse.json({
      provider: inference.provider,
      model: inference.model,
      response: inference.prediction.reasoning,
      confidence: inference.prediction.confidence,
      coordinates:
        inference.prediction.latitude === null || inference.prediction.longitude === null
          ? null
          : {
              lat: inference.prediction.latitude,
              lng: inference.prediction.longitude,
            },
      processingTime: formatProcessingTime(inference.processingTimeMs),
      processingTimeMs: inference.processingTimeMs,
    });

  } catch (error) {
    console.error("Error calling geoguess API:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to get response from model: ${errorMsg}` }, { status: 500 });
  }
}
