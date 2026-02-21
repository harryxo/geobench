import { describe, expect, it, vi } from "vitest";
import { inferGeoguess } from "./geoguess-inference";

describe("inferGeoguess", () => {
  it("parses a successful OpenRouter response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: `{"latitude":10.1,"longitude":20.2,"reasoning":"Road signs match region","confidence":"High"}`,
            },
          },
        ],
      }),
    });

    const result = await inferGeoguess(
      {
        provider: "openrouter",
        model: "openai/gpt-4o-mini",
        imageBuffer: Buffer.from("img"),
        mimeType: "image/jpeg",
      },
      {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        env: { OPENROUTER_API_KEY: "test-key" },
      },
    );

    expect(result.provider).toBe("openrouter");
    expect(result.model).toBe("openai/gpt-4o-mini");
    expect(result.prediction.latitude).toBe(10.1);
    expect(result.prediction.longitude).toBe(20.2);
    expect(result.prediction.reasoning).toContain("Road signs");
  });

  it("throws when OpenRouter returns an error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "bad request" },
      }),
    });

    await expect(
      inferGeoguess(
        {
          provider: "openrouter",
          model: "openai/gpt-4o-mini",
          imageBuffer: Buffer.from("img"),
          mimeType: "image/jpeg",
        },
        {
          fetchImpl: fetchImpl as unknown as typeof fetch,
          env: { OPENROUTER_API_KEY: "test-key" },
        },
      ),
    ).rejects.toThrow("bad request");
  });
});
