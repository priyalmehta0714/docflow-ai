import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env at repo root.");
  }
  if (!openai) {
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
  const res = await getOpenAI().embeddings.create({
    model,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}