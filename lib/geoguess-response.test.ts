import { describe, expect, it } from "vitest";
import { extractJsonObject, formatProcessingTime, parseModelPredictionFromText } from "./geoguess-response";

describe("extractJsonObject", () => {
  it("extracts JSON wrapped in markdown fences", () => {
    const input = '```json\n{"latitude":12.3,"longitude":45.6,"reasoning":"x","confidence":"High"}\n```';
    const extracted = extractJsonObject(input);
    expect(extracted).toBe('{"latitude":12.3,"longitude":45.6,"reasoning":"x","confidence":"High"}');
  });

  it("extracts raw JSON", () => {
    const input = '{"latitude":12.3,"longitude":45.6,"reasoning":"x","confidence":"High"}';
    const extracted = extractJsonObject(input);
    expect(extracted).toBe(input);
  });
});

describe("parseModelPredictionFromText", () => {
  it("parses number coordinates", () => {
    const parsed = parseModelPredictionFromText(
      '{"latitude":12.3,"longitude":45.6,"reasoning":"Road signs look French","confidence":"High"}',
    );

    expect(parsed).toEqual({
      latitude: 12.3,
      longitude: 45.6,
      reasoning: "Road signs look French",
      confidence: "High",
    });
  });

  it("parses string coordinates and defaults missing confidence", () => {
    const parsed = parseModelPredictionFromText(
      '{"latitude":"12.3","longitude":"45.6","reasoning":"Mountain region"}',
    );

    expect(parsed).toEqual({
      latitude: 12.3,
      longitude: 45.6,
      reasoning: "Mountain region",
      confidence: "N/A",
    });
  });

  it("allows null coordinates when model is unsure", () => {
    const parsed = parseModelPredictionFromText(
      '{"latitude":null,"longitude":null,"reasoning":"Insufficient clues","confidence":"Low"}',
    );

    expect(parsed.latitude).toBeNull();
    expect(parsed.longitude).toBeNull();
  });

  it("throws on invalid payload", () => {
    expect(() => parseModelPredictionFromText('{"reasoning":"Missing coords"}')).toThrow();
  });
});

describe("formatProcessingTime", () => {
  it("formats and rounds milliseconds", () => {
    expect(formatProcessingTime(27.6)).toBe("28 ms");
  });

  it("never returns a negative duration", () => {
    expect(formatProcessingTime(-5)).toBe("0 ms");
  });
});
