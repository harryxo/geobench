import { describe, expect, it } from "vitest";
import { resolveProviderAndModel, validateProviderEnv } from "./geoguess-provider-config";

describe("resolveProviderAndModel", () => {
  it("defaults to openrouter with default model", () => {
    const resolved = resolveProviderAndModel(null, null, {});
    expect(resolved).toEqual({ provider: "openrouter", model: "openai/gpt-4o-mini" });
  });

  it("uses explicit provider and model", () => {
    const resolved = resolveProviderAndModel("vertex", "gemini-2.5-pro-exp-03-25", {});
    expect(resolved).toEqual({ provider: "vertex", model: "gemini-2.5-pro-exp-03-25" });
  });

  it("uses provider defaults from env when no model provided", () => {
    const resolved = resolveProviderAndModel("openrouter", null, { OPENROUTER_MODEL: "openai/gpt-4o" });
    expect(resolved).toEqual({ provider: "openrouter", model: "openai/gpt-4o" });
  });

  it("falls back to env default provider", () => {
    const resolved = resolveProviderAndModel(null, null, { GEOGUESS_DEFAULT_PROVIDER: "vertex", VERTEX_MODEL_NAME: "gemini-2.0-flash" });
    expect(resolved).toEqual({ provider: "vertex", model: "gemini-2.0-flash" });
  });
});

describe("validateProviderEnv", () => {
  it("requires openrouter key", () => {
    expect(validateProviderEnv("openrouter", {})).toContain("OPENROUTER_API_KEY");
  });

  it("requires vertex project and location", () => {
    expect(validateProviderEnv("vertex", {})).toContain("GCP_PROJECT_ID");
  });

  it("returns null when env is valid", () => {
    expect(validateProviderEnv("openrouter", { OPENROUTER_API_KEY: "x" })).toBeNull();
    expect(validateProviderEnv("vertex", { GCP_PROJECT_ID: "p", VERTEXAI_LOCATION: "us-central1" })).toBeNull();
  });
});
