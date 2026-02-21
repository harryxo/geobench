// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useModelSelection } from "./use-model-selection";

describe("useModelSelection", () => {
  it("toggles model ids", () => {
    const { result } = renderHook(() => useModelSelection(["a"]));

    act(() => {
      result.current.toggleModelSelection("b");
    });
    expect(result.current.selectedModels).toEqual(["a", "b"]);

    act(() => {
      result.current.toggleModelSelection("a");
    });
    expect(result.current.selectedModels).toEqual(["b"]);
  });
});
