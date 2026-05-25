import OpenAI from "openai";
import type { RetrievedChunk } from "./retriever.js";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env at repo root.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export type RagAnswerResult = {
  answer: string;
  citations: Array<{
    vectorId: string;
    snippet: string;
    score: number;
  }>;
  model: string;
};

export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[]
): Promise<RagAnswerResult> {
  const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

  const contextBlocks = chunks
    .map((c, i) => `[${i + 1}] (score ${c.score.toFixed(2)})\n${c.content}`)
    .join("\n\n");

  const systemPrompt = `You are a document assistant. Answer ONLY using the context below.
If the answer is not in the context, say: "I cannot find that in the document."
Use citation markers like [1], [2] when you use a source.`;

  const userPrompt = `Context:\n${contextBlocks}\n\nQuestion: ${question}`;

  const completion = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const answer =
    completion.choices[0]?.message?.content?.trim() ??
    "I cannot find that in the document.";

  const citations = chunks.map((c) => ({
    vectorId: c.vectorId,
    snippet: c.content.slice(0, 300),
    score: c.score,
  }));

  return { answer, citations, model };
}
