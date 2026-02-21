export type GenerativePart = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

export function bufferToGenerativePart(buffer: Buffer, mimeType: string): GenerativePart {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}
