import "./load-env.js";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { INGEST_QUEUE_NAME } from "@docflow/shared";
import { processIngestJob } from "./processors/ingest.processor.js";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(INGEST_QUEUE_NAME, processIngestJob, {
  connection,
  concurrency: 1,
});

worker.on("completed", (job) => {
  console.log("✅ Job done:", job.id, job.returnvalue);
});

worker.on("failed", (job, err) => {
  console.error("❌ Job failed:", job?.id, err.message);
});

console.log("Worker running. Queue:", INGEST_QUEUE_NAME);
