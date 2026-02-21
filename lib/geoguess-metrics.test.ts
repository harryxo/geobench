import { describe, expect, it } from "vitest";
import { buildBenchmarkSummary, computeDistanceKm } from "./geoguess-metrics";

describe("computeDistanceKm", () => {
  it("converts meters to kilometers", () => {
    expect(computeDistanceKm(1234)).toBeCloseTo(1.234);
  });
});

describe("buildBenchmarkSummary", () => {
  it("aggregates outcomes correctly", () => {
    const summary = buildBenchmarkSummary({
      totalResults: 4,
      outcomes: [
        { distanceKm: 10, isCorrect: true },
        { distanceKm: 200, isCorrect: false },
        { distanceKm: null, isCorrect: null, predictedError: "Vertex AI Error: fail" },
        { distanceKm: null, isCorrect: null, predictedError: "Skipped: Missing panoId" },
      ],
    });

    expect(summary.processedCount).toBe(3);
    expect(summary.successfulCount).toBe(2);
    expect(summary.failedCount).toBe(1);
    expect(summary.withCoordsCount).toBe(2);
    expect(summary.correctCount).toBe(1);
    expect(summary.averageDistanceKm).toBe(105);
    expect(summary.overallAccuracy).toBeCloseTo(33.3333, 3);
    expect(summary.processingAccuracy).toBe(50);
    expect(summary.predictionAccuracy).toBe(50);
  });
});
