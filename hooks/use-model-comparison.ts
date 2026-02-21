import { type Dispatch, type SetStateAction, useState } from "react";
import type { ArenaModel } from "@/lib/arena-config";
import { requestModelGuess } from "@/lib/api/geoguess-client";

export type ModelResult = {
  model: string;
  response: string;
  coordinates: { lat: number; lng: number } | null;
  processingTime: string;
  error?: string;
};

type UseModelComparisonResult = {
  isLoading: boolean;
  results: Record<string, ModelResult>;
  setResults: Dispatch<SetStateAction<Record<string, ModelResult>>>;
  runComparison: (args: { imageFile: File; selectedModels: string[]; modelCatalog: ArenaModel[] }) => Promise<void>;
};

export function useModelComparison(): UseModelComparisonResult {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Record<string, ModelResult>>({});

  const runComparison = async ({
    imageFile,
    selectedModels,
    modelCatalog,
  }: {
    imageFile: File;
    selectedModels: string[];
    modelCatalog: ArenaModel[];
  }) => {
    if (!imageFile || selectedModels.length === 0) {
      return;
    }

    setIsLoading(true);
    const newResults: Record<string, ModelResult> = {};

    try {
      const selectedModelConfigs = modelCatalog.filter((model) => selectedModels.includes(model.id));
      const settledResults = await Promise.all(
        selectedModelConfigs.map(async (modelConfig) => {
          try {
            const modelResult = await requestModelGuess(imageFile, modelConfig);
            return [
              modelConfig.id,
              {
                model: modelResult.model || modelConfig.model,
                response: modelResult.response || "",
                coordinates: modelResult.coordinates ?? null,
                processingTime:
                  modelResult.processingTime ||
                  (typeof modelResult.processingTimeMs === "number" ? `${Math.round(modelResult.processingTimeMs)} ms` : "N/A"),
              } satisfies ModelResult,
            ] as const;
          } catch (error) {
            return [
              modelConfig.id,
              {
                model: modelConfig.model,
                response: "",
                coordinates: null,
                processingTime: "",
                error: error instanceof Error ? error.message : String(error),
              } satisfies ModelResult,
            ] as const;
          }
        }),
      );

      settledResults.forEach(([id, modelResult]) => {
        newResults[id] = modelResult;
      });

      setResults(newResults);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    results,
    setResults,
    runComparison,
  };
}
