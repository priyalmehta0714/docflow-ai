import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";
import { Job } from "bullmq";
import { prisma, DocStatus } from "@docflow/db";
import type { IngestJobData } from "@docflow/shared";
import { chunkText, embedTexts, getChunkIndex } from "@docflow/rag";
import { resolveStoragePath } from "../utils/resolve-path.js";

export async function processIngestJob(job: Job<IngestJobData>) {
  const { documentId, tenantId, storagePath } = job.data;

  console.log("Processing document:", documentId);

  await prisma.document.update({
    where: { id: documentId },
    data: { status: DocStatus.PROCESSING, errorMessage: null },
  });

  try {
    const filePath = resolveStoragePath(storagePath);
    console.log("Reading file:", filePath);

    const buffer = await readFile(filePath);
    const parsed = await pdfParse(buffer);
    const text = parsed.text ?? "";

    if (!text.trim()) {
      throw new Error("No text in PDF (scanned PDFs need OCR later)");
    }

    const chunks = chunkText(text);
    console.log("Text length:", text.length, "Chunks:", chunks.length);

    if (chunks.length === 0) {
      throw new Error(
        "PDF has text but no chunks were created. Try a different PDF with readable text."
      );
    }

    const index = getChunkIndex();
    const batchSize = 20;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const vectors = await embedTexts(batch.map((c) => c.content));

      const records = batch.map((chunk, j) => ({
        id: `${documentId}_chunk_${i + j}`,
        values: vectors[j],
        metadata: {
          tenantId,
          documentId,
          content: chunk.content.slice(0, 1000),
        },
      }));

      // Pinecone SDK v7: must pass { records: [...] }, not a bare array
      await index.upsert({ records });

      for (let j = 0; j < batch.length; j++) {
        await prisma.chunk.create({
          data: {
            documentId,
            tenantId,
            content: batch[j].content,
            tokenCount: batch[j].tokenCount,
            vectorId: `${documentId}_chunk_${i + j}`,
          },
        });
      }
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocStatus.READY,
        pageCount: parsed.numpages ?? null,
      },
    });

    console.log("Done:", documentId, "chunks:", chunks.length);
    return { chunks: chunks.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed:", documentId, message);

    await prisma.document.update({
      where: { id: documentId },
      data: { status: DocStatus.FAILED, errorMessage: message },
    });

    throw err;
  }
}