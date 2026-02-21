import { useState } from "react";

export function useModelSelection(defaultSelectedModels: string[]) {
  const [selectedModels, setSelectedModels] = useState<string[]>(defaultSelectedModels);

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels((prev) => (prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]));
  };

  return {
    selectedModels,
    toggleModelSelection,
  };
}
