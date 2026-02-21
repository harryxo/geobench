import type { GeoguessProvider } from "./geoguess-provider-config";

export type ArenaModel = {
  id: string;
  name: string;
  color: string;
  provider: GeoguessProvider;
  model: string;
};

export const OPENROUTER_GPT4O_ID = "openrouter-gpt4o";
export const OPENROUTER_CLAUDE_ID = "openrouter-claude";
export const OPENROUTER_GEMINI_FLASH_ID = "openrouter-gemini-flash";
export const VERTEX_GEMINI_ID = "vertex-gemini";

export const ARENA_MODELS: ArenaModel[] = [
  {
    id: OPENROUTER_GPT4O_ID,
    name: "GPT-4o (OpenRouter)",
    color: "#10a37f",
    provider: "openrouter",
    model: "openai/gpt-4o",
  },
  {
    id: OPENROUTER_CLAUDE_ID,
    name: "Claude 3.5 Sonnet (OpenRouter)",
    color: "#7c3aed",
    provider: "openrouter",
    model: "anthropic/claude-3.5-sonnet",
  },
  {
    id: OPENROUTER_GEMINI_FLASH_ID,
    name: "Gemini 2.0 Flash (OpenRouter)",
    color: "#1a73e8",
    provider: "openrouter",
    model: "google/gemini-2.0-flash-001",
  },
  {
    id: VERTEX_GEMINI_ID,
    name: "Gemini 2.5 Pro (Vertex)",
    color: "#4285F4",
    provider: "vertex",
    model: "gemini-2.5-pro-exp-03-25",
  },
];

export const DEFAULT_SELECTED_MODEL_IDS = [OPENROUTER_GPT4O_ID, OPENROUTER_CLAUDE_ID, OPENROUTER_GEMINI_FLASH_ID];
