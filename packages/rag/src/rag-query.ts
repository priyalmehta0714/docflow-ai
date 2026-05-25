import { retrieveChunks } from "./retriever.js";
import { generateAnswer } from "./answer.js";

export type QueryDocumentResult = {
  answer: string;
  citations: Array<{
    vectorId: string;
    snippet: string;
    score: number;
  }>;
  refused: boolean;
  model: string;
};

export async function queryDocument(
  question: string,
  tenantId: string,
  documentId: string
): Promise<QueryDocumentResult> {
  const chunks = await retrieveChunks(question, tenantId, documentId);

  if (chunks.length === 0) {
    return {
      answer:
        "I cannot answer this from the document. No relevant content was found (try rephrasing or check that processing finished).",
      citations: [],
      refused: true,
      model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    };
  }

  const { answer, citations, model } = await generateAnswer(question, chunks);

  return {
    answer,
    citations,
    refused: false,
    model,
  };
}
