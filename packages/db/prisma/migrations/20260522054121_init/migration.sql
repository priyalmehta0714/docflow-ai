-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "status" "DocStatus" NOT NULL DEFAULT 'PENDING',
    "pageCount" INTEGER,
    "docType" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "tokenCount" INTEGER NOT NULL,
    "vectorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "citations" JSONB NOT NULL,
    "refused" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "tokenUsage" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraction" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "schemaType" TEXT NOT NULL,
    "resultJson" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" "ExtractionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- CreateIndex
CREATE INDEX "Document_tenantId_status_idx" ON "Document"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Chunk_documentId_idx" ON "Chunk"("documentId");

-- CreateIndex
CREATE INDEX "Chunk_tenantId_idx" ON "Chunk"("tenantId");

-- CreateIndex
CREATE INDEX "QueryLog_tenantId_idx" ON "QueryLog"("tenantId");

-- CreateIndex
CREATE INDEX "QueryLog_documentId_idx" ON "QueryLog"("documentId");

-- CreateIndex
CREATE INDEX "Extraction_documentId_idx" ON "Extraction"("documentId");

-- CreateIndex
CREATE INDEX "Extraction_tenantId_idx" ON "Extraction"("tenantId");

-- CreateIndex
CREATE INDEX "Job_tenantId_status_idx" ON "Job"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryLog" ADD CONSTRAINT "QueryLog_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extraction" ADD CONSTRAINT "Extraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
