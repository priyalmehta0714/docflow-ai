import { embedTexts } from "./embedder.js";
import { getChunkIndex } from "./pinecone.js";

export type RetrievedChunk = {
  vectorId: string;
  score: number;
  content: string;
};

export async function retrieveChunks(
  question: string,
  tenantId: string,
  documentId: string
): Promise<RetrievedChunk[]> {
  const topK = Number(process.env.RAG_TOP_K ?? 5);
  // 0.72 is often too strict; cosine scores for short PDFs are frequently 0.35–0.65
  const minScore = Number(process.env.RAG_SCORE_THRESHOLD ?? 0.35);

  const [queryVector] = await embedTexts([question]);
  const index = getChunkIndex();

  const metadataFilter = {
    tenantId: { $eq: tenantId },
    documentId: { $eq: documentId },
  };

  let result = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter: metadataFilter,
  });

  let matches = result.matches ?? [];

  // Fallback: some Pinecone setups ignore or mishandle filters — query wider, filter in code
  if (matches.length === 0) {
    result = await index.query({
      vector: queryVector,
      topK: Math.max(topK, 10),
      includeMetadata: true,
    });
    matches = (result.matches ?? []).filter(
      (m) =>
        m.metadata?.tenantId === tenantId && m.metadata?.documentId === documentId
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[RAG] Pinecone matches:",
      matches.map((m) => ({ id: m.id, score: m.score }))
    );
  }

  const ranked = matches
    .map((m) => ({
      vectorId: m.id ?? "",
      score: m.score ?? 0,
      content: String(m.metadata?.content ?? ""),
    }))
    .filter((m) => m.content.length > 0)
    .sort((a, b) => b.score - a.score);

  const aboveThreshold = ranked.filter((m) => m.score >= minScore);

  // If document has very few chunks, use best match rather than refusing
  if (aboveThreshold.length > 0) {
    return aboveThreshold;
  }

  if (ranked.length > 0) {
    return [ranked[0]];
  }

  return [];
}
