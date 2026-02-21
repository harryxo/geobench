// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useModelComparison } from "./use-model-comparison";

vi.mock("@/lib/api/geoguess-client", () => ({
  requestModelGuess: vi.fn(),
}));

import { requestModelGuess } from "@/lib/api/geoguess-client";

describe("useModelComparison", () => {
  it("stores successful model results", async () => {
    vi.mocked(requestModelGuess).mockResolvedValueOnce({
      provider: "openrouter",
      model: "openai/gpt-4o-mini",
      response: "Test reasoning",
      confidence: "High",
      coordinates: { lat: 1, lng: 2 },
      processingTime: "10 ms",
      processingTimeMs: 10,
    });

    const { result } = renderHook(() => useModelComparison());
    const file = new File(["abc"], "x.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runComparison({
        imageFile: file,
        selectedModels: ["m1"],
        modelCatalog: [
          { id: "m1", name: "Model 1", color: "#fff", provider: "openrouter", model: "openai/gpt-4o-mini" },
        ],
      });
    });

    expect(result.current.results.m1.response).toBe("Test reasoning");
    expect(result.current.results.m1.error).toBeUndefined();
  });

  it("captures request errors", async () => {
    vi.mocked(requestModelGuess).mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useModelComparison());
    const file = new File(["abc"], "x.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.runComparison({
        imageFile: file,
        selectedModels: ["m2"],
        modelCatalog: [
          { id: "m2", name: "Model 2", color: "#fff", provider: "openrouter", model: "openai/gpt-4o-mini" },
        ],
      });
    });

    expect(result.current.results.m2.error).toContain("boom");
  });
});
