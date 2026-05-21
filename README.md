# DocFlow AI

Document ingestion, Pinecone vector search, and citation-backed Q&A.

## Status
- Step 1: Repo scaffold (in progress)

## Stack
- Node.js, TypeScript, pnpm monorepo
- PostgreSQL, Redis, Pinecone, OpenAI

## Docs
- See `docs/architecture.md` (coming in Step 2)

## Quick start
## Local services (Step 3)

1. Install Docker Desktop
2. Copy `.env.example` to `.env` and fill secrets
3. Start database and Redis:

   ```bash
   cd infra
   docker compose up -d