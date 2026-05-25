import { Queue } from "bullmq";
import IORedis from "ioredis";
import { INGEST_QUEUE_NAME } from "@docflow/shared";

export type IngestJobData = {
  documentId: string;
  tenantId: string;
  storagePath: string;
};

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const ingestQueue = new Queue<IngestJobData>(INGEST_QUEUE_NAME, {
  connection,
});

export async function enqueueIngestJob(data: IngestJobData) {
  await ingestQueue.add("ingest", data, {
    jobId: `ingest-${data.documentId}`,
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}
