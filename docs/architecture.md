# Architecture (draft)

1. User uploads PDF → API
2. Worker parses → chunks → OpenAI embeddings → Pinecone
3. User asks question → embed query → Pinecone retrieve → OpenAI answer + citations
4. Metadata and audit in PostgreSQL