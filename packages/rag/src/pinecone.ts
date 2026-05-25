import { Pinecone } from "@pinecone-database/pinecone";

let client: Pinecone | null = null;

export function getPinecone() {
  if (!client) {
    client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return client;
}

export function getChunkIndex() {
  const indexName = process.env.PINECONE_INDEX ?? "docflow-chunks";
  return getPinecone().index(indexName);
}