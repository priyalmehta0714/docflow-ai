export type TextChunk = {
  content: string;
  pageStart?: number;
  pageEnd?: number;
  tokenCount: number;
};

// ~4 characters per token (rough estimate)
export function chunkText(text: string, maxTokens = 800, overlapTokens = 100): TextChunk[] {
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;
  const chunks: TextChunk[] = [];

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        tokenCount: Math.ceil(content.length / 4),
      });
    }
    if (end >= text.length) break;
    const nextStart = end - overlapChars;
    if (nextStart <= start) {
      start = end;
    } else {
      start = nextStart;
    }
  }

  return chunks;
}