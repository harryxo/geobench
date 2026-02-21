export type GeoguessProvider = "openrouter" | "vertex";
type GeoguessEnv = Record<string, string | undefined>;

export type ProviderResolution = {
  provider: GeoguessProvider;
  model: string;
};

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const DEFAULT_VERTEX_MODEL = "gemini-2.5-pro-exp-03-25";

function normalizeProvider(value: string | null | undefined): GeoguessProvider | null {
  if (!value) {
    return null;
  }

  const lowered = value.trim().toLowerCase();
  if (lowered === "openrouter" || lowered === "vertex") {
    return lowered;
  }

  return null;
}

export function resolveProviderAndModel(
  providerInput: string | null | undefined,
  modelInput: string | null | undefined,
  env: GeoguessEnv = process.env,
): ProviderResolution {
  const resolvedProvider =
    normalizeProvider(providerInput) ??
    normalizeProvider(env.GEOGUESS_DEFAULT_PROVIDER) ??
    "openrouter";

  const explicitModel = modelInput?.trim();
  if (explicitModel) {
    return { provider: resolvedProvider, model: explicitModel };
  }

  if (resolvedProvider === "openrouter") {
    return {
      provider: resolvedProvider,
      model: env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
    };
  }

  return {
    provider: resolvedProvider,
    model: env.VERTEX_MODEL_NAME?.trim() || DEFAULT_VERTEX_MODEL,
  };
}

export function validateProviderEnv(provider: GeoguessProvider, env: GeoguessEnv = process.env): string | null {
  if (provider === "openrouter" && !env.OPENROUTER_API_KEY) {
    return "OPENROUTER_API_KEY is not configured.";
  }

  if (provider === "vertex" && (!env.GCP_PROJECT_ID || !env.VERTEXAI_LOCATION)) {
    return "Vertex AI is not configured. Set GCP_PROJECT_ID and VERTEXAI_LOCATION.";
  }

  return null;
}
