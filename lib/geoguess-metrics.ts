export interface PredictionOutcome {
  predictedError?: string;
  distanceKm: number | null;
  isCorrect: boolean | null;
}

export interface BenchmarkSummaryInput {
  totalResults: number;
  outcomes: PredictionOutcome[];
}

export interface BenchmarkSummary {
  processedCount: number;
  successfulCount: number;
  failedCount: number;
  withCoordsCount: number;
  correctCount: number;
  averageDistanceKm: number | null;
  overallAccuracy: number;
  processingAccuracy: number;
  predictionAccuracy: number;
}

export function computeDistanceKm(
  haversineMeters: number,
): number {
  return haversineMeters / 1000;
}

export function buildBenchmarkSummary(input: BenchmarkSummaryInput): BenchmarkSummary {
  const processed = input.outcomes.filter((o) => o.predictedError !== "Skipped: Missing panoId");
  const successful = processed.filter((o) => o.predictedError === undefined);
  const withCoords = successful.filter((o) => o.distanceKm !== null);
  const correctCount = withCoords.filter((o) => o.isCorrect).length;

  const averageDistanceKm =
    withCoords.length > 0
      ? withCoords.reduce((sum, item) => sum + (item.distanceKm ?? 0), 0) / withCoords.length
      : null;

  const overallAccuracy = processed.length > 0 ? (correctCount / processed.length) * 100 : 0;
  const processingAccuracy = successful.length > 0 ? (correctCount / successful.length) * 100 : 0;
  const predictionAccuracy = withCoords.length > 0 ? (correctCount / withCoords.length) * 100 : 0;

  return {
    processedCount: processed.length,
    successfulCount: successful.length,
    failedCount: processed.length - successful.length,
    withCoordsCount: withCoords.length,
    correctCount,
    averageDistanceKm,
    overallAccuracy,
    processingAccuracy,
    predictionAccuracy,
  };
}
