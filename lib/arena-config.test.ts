import { describe, expect, it } from "vitest";
import {
  ARENA_MODELS,
  DEFAULT_SELECTED_MODEL_IDS,
  OPENROUTER_CLAUDE_ID,
  OPENROUTER_GEMINI_FLASH_ID,
  OPENROUTER_GPT4O_ID,
  VERTEX_GEMINI_ID,
} from "./arena-config";

describe("arena model config", () => {
  it("contains expected built-in model ids", () => {
    expect(ARENA_MODELS.some((model) => model.id === OPENROUTER_GPT4O_ID)).toBe(true);
    expect(ARENA_MODELS.some((model) => model.id === OPENROUTER_CLAUDE_ID)).toBe(true);
    expect(ARENA_MODELS.some((model) => model.id === OPENROUTER_GEMINI_FLASH_ID)).toBe(true);
    expect(ARENA_MODELS.some((model) => model.id === VERTEX_GEMINI_ID)).toBe(true);
  });

  it("defaults to OpenRouter-backed models", () => {
    expect(DEFAULT_SELECTED_MODEL_IDS).toContain(OPENROUTER_GPT4O_ID);
    expect(DEFAULT_SELECTED_MODEL_IDS).toContain(OPENROUTER_CLAUDE_ID);
    expect(DEFAULT_SELECTED_MODEL_IDS).toContain(OPENROUTER_GEMINI_FLASH_ID);
  });

  it("defines provider and model for every entry", () => {
    ARENA_MODELS.forEach((model) => {
      expect(model.provider === "openrouter" || model.provider === "vertex").toBe(true);
      expect(model.model.length).toBeGreaterThan(0);
    });
  });
});
