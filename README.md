# DocFlow AI
## Live demo
- API: https://zesty-inspiration-production-1a1d.up.railway.app/health
- Walkthrough: [2-min Postman demo](https://www.loom.com/share/040e3f1982e34810ab0118c4ef7f9b6a)

**DocFlow AI** is a production-style document intelligence API built with Node.js. Upload PDFs, process them in the background, store embeddings in Pinecone, and ask questions with **citation-backed** answers.

Live demo: replace with your Railway URL after deploy, e.g. `https://docflow-api.up.railway.app`

---

## Features

- JWT authentication (multi-tenant ready)
- PDF upload with validation
- Async ingest worker (BullMQ + Redis)
- Text chunking + OpenAI embeddings
- Pinecone vector search
- RAG Q&A with citations and audit logs (`QueryLog`)
- Health check for deployment

---

## Architecture

```mermaid
flowchart LR
  Client[Postman / Client]
  API[Fastify API]
  Redis[(Redis Queue)]
  Worker[Ingest Worker]
  PG[(PostgreSQL)]
  PC[(Pinecone)]
  OAI[OpenAI]

  Client --> API
  API --> PG
  API --> Redis
  Redis --> Worker
  Worker --> PG
  Worker --> PC
  Worker --> OAI
  API --> PC
  API --> OAI
```

**Flow**

1. `POST /documents` — save PDF + enqueue job  
2. Worker — parse PDF → chunks → embed → Pinecone → `READY`  
3. `POST /documents/:id/query` — RAG answer + citations  

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | Node.js, TypeScript, Fastify |
| Worker | BullMQ, Redis |
| DB | PostgreSQL, Prisma |
| Vectors | Pinecone |
| AI | OpenAI (embeddings + chat) |
| Monorepo | pnpm workspaces |

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (local dev)
- [OpenAI API key](https://platform.openai.com)
- [Pinecone](https://app.pinecone.io) index (1536 dimensions, cosine)

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url>
cd docflow-ai
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in `.env`:

```bash
DATABASE_URL=postgresql://docflow:docflow@127.0.0.1:5434/docflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-long-secret-min-32-chars
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=docflow-chunks
UPLOAD_DIR=./apps/api/uploads
RAG_SCORE_THRESHOLD=0.35
API_PORT=3001
```

### 3. Start Postgres + Redis

```bash
pnpm docker:up
```

### 4. Database migrate

```bash
pnpm db:migrate
```

### 5. Run API + Worker (two terminals)

```bash
pnpm dev:api
pnpm dev:worker
```

### 6. Health check

```bash
curl http://localhost:3001/health
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness + DB ping |
| POST | `/auth/register` | No | Create user (dev) |
| POST | `/auth/login` | No | Get JWT |
| GET | `/me` | Bearer | Current user |
| POST | `/documents` | Bearer | Upload PDF (multipart `file`) |
| GET | `/documents` | Bearer | List documents |
| GET | `/documents/:id` | Bearer | Get document |
| POST | `/documents/:id/query` | Bearer | RAG question |

---

## Postman (Local + Live Demo)

### Import collection

1. Open Postman → **Import**
2. File: `docs/postman/DocFlow.postman_collection.json`
3. Import environment:
   - Local: `docs/postman/DocFlow-Local.postman_environment.json`
   - Production: `docs/postman/DocFlow-Production.postman_environment.json`

### Run order

1. **Health** — should return `{ "ok": true }`
2. **Auth - Login** — saves `token` automatically
3. **Documents - Upload PDF** — select a PDF file for `file` field
4. Wait until **Documents - Get One** shows `"status": "READY"` (worker running locally or on server)
5. **Documents - Query (RAG)** — must be **POST**, not GET

### Live demo (after deploy)

1. Set environment `baseUrl` to your Railway URL (no trailing slash)
2. Run the same steps in order
3. Record a short screen capture for LinkedIn / Upwork

---

## Deploy to Railway (Recommended)

We run **API + worker in one service** so they share the same disk for uploaded PDFs.

### Step 1 — Push code to GitHub

```bash
git add .
git commit -m "feat: docflow MVP ready for deploy"
git push origin main
```

### Step 2 — Create Railway project

1. Go to [https://railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select `docflow-ai`

### Step 3 — Add PostgreSQL

1. Project → **+ New** → **Database** → **PostgreSQL**
2. Copy `DATABASE_URL` from Postgres service variables

### Step 4 — Add Redis

1. **+ New** → **Database** → **Redis**
2. Copy `REDIS_URL`

### Step 5 — Configure app service variables

On your **app service** (GitHub repo), set **Variables**:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | long random string (32+ chars) |
| `OPENAI_API_KEY` | your key |
| `OPENAI_EMBED_MODEL` | `text-embedding-3-small` |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` |
| `PINECONE_API_KEY` | your key |
| `PINECONE_INDEX` | `docflow-chunks` |
| `DATABASE_URL` | from Railway Postgres |
| `REDIS_URL` | from Railway Redis |
| `UPLOAD_DIR` | `/app/apps/api/uploads` |
| `RAG_SCORE_THRESHOLD` | `0.35` |
| `RAG_TOP_K` | `5` |
| `MAX_UPLOAD_MB` | `25` |

Railway sets `PORT` automatically — the API uses it.

### Step 6 — Deploy settings

| Setting | Value |
|---------|--------|
| Root Directory | `/` (repo root) |
| Build Command | `pnpm install && pnpm build` |
| Start Command | `pnpm start:prod` |

Or use included `railway.toml`.

### Step 7 — Generate domain

1. App service → **Settings** → **Networking** → **Generate Domain**
2. URL example: `https://docflow-ai-production.up.railway.app`

### Step 8 — Verify

```bash
curl https://YOUR-DOMAIN.up.railway.app/health
```

Update Postman production environment `baseUrl` to that URL.

---

## Project Structure

```text
docflow-ai/
├── apps/
│   ├── api/          # Fastify REST API
│   └── worker/       # PDF ingest worker
├── packages/
│   ├── db/           # Prisma schema
│   ├── rag/          # Chunk, embed, retrieve, answer
│   └── shared/       # Env + queue constants
├── infra/            # Docker compose (local)
├── docs/postman/     # Postman collection
└── scripts/          # Production start script
```

---

## Environment Variables

See `.env.example` for full list.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Route GET .../query not found` | Use **POST** for `/query` |
| `refused: true` | Lower `RAG_SCORE_THRESHOLD` to `0.35` |
| Worker not processing | Ensure worker is running (local: `pnpm dev:worker`, prod: `start:prod`) |
| Upload works but query empty on Railway | API and worker must be same service (`start:prod`) |
| DB connection error | Check `DATABASE_URL` and Postgres plugin |

---

## License

MIT

---

## Author

Your Name — [LinkedIn](https://linkedin.com/in/yourprofile) | [GitHub](https://github.com/yourusername)
