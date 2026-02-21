export const GEOGUESS_PROMPT = `
  Analyze the provided image and identify the geographic location depicted.
  Respond ONLY with a JSON object containing the following keys:
  - "latitude": The estimated latitude (float or null).
  - "longitude": The estimated longitude (float or null).
  - "reasoning": A brief explanation of how you identified the location (string).
  - "confidence": Your confidence level (e.g., "High", "Medium", "Low") (string).

  Example Response:
  {
    "latitude": 48.8584,
    "longitude": 2.2945,
    "reasoning": "The image clearly shows the Eiffel Tower in Paris, France.",
    "confidence": "High"
  }

  If you cannot determine a location, respond with null values for latitude and longitude and explain why in the reasoning.
`;

export const GEOGUESS_GENERATION_CONFIG = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 4096,
};

export function createSafetySettings<TCategory, TThreshold>(
  HarmCategory: Record<string, TCategory>,
  HarmBlockThreshold: Record<string, TThreshold>,
): Array<{ category: TCategory; threshold: TThreshold }> {
  return [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];
}
