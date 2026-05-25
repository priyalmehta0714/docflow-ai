import { FastifyPluginAsync } from "fastify";
import { mkdir, writeFile } from "fs/promises";
import { join, extname, resolve } from "path";
import { randomUUID } from "crypto";
import { prisma, DocStatus } from "@docflow/db";
import { requireAuth } from "../utils/require-auth.js";
import { enqueueIngestJob } from "../queues/ingest.queue.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);
const MAX_BYTES = MAX_MB * 1024 * 1024;

export const documentRoutes: FastifyPluginAsync = async (app) => {
  // All routes in this file need login
  app.addHook("preHandler", requireAuth);

  // POST /documents — upload PDF
  app.post("/documents", async (request, reply) => {
    const { tenantId, sub: userId } = request.user;

    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "No file uploaded. Use field name: file" });
    }

    if (file.mimetype !== "application/pdf") {
      return reply.code(400).send({ error: "Only PDF files are allowed" });
    }

    const buffer = await file.toBuffer();
    if (buffer.length > MAX_BYTES) {
      return reply.code(400).send({ error: `File too large. Max ${MAX_MB} MB` });
    }

    const documentId = randomUUID();
    const tenantDir = join(UPLOAD_DIR, tenantId);
    await mkdir(tenantDir, { recursive: true });

    const filename = file.filename || "document.pdf";
    const safeName = `${documentId}${extname(filename) || ".pdf"}`;
    const storagePath = resolve(join(tenantDir, safeName));

    await writeFile(storagePath, buffer);

    const doc = await prisma.document.create({
      data: {
        id: documentId,
        tenantId,
        filename,
        mimeType: file.mimetype,
        storagePath,
        status: DocStatus.PENDING,
      },
    });

    await enqueueIngestJob({
      documentId: doc.id,
      tenantId: doc.tenantId,
      storagePath: doc.storagePath,
    });

    return reply.code(201).send({
      message: "Uploaded. Worker is processing in background.",
      document: {
        id: doc.id,
        filename: doc.filename,
        status: doc.status,
        storagePath: doc.storagePath,
        createdAt: doc.createdAt,
      },
    });
  });

  // GET /documents — list for this tenant
  app.get("/documents", async (request) => {
    const { tenantId } = request.user;

    const documents = await prisma.document.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        status: true,
        pageCount: true,
        docType: true,
        createdAt: true,
      },
    });

    return { documents };
  });

  // GET /documents/:id — one document
  app.get("/documents/:id", async (request, reply) => {
    const { tenantId } = request.user;
    const { id } = request.params as { id: string };

    const doc = await prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!doc) {
      return reply.code(404).send({ error: "Document not found" });
    }

    return { document: doc };
  });
};