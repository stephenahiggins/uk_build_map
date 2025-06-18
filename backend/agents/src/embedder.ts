// /agents/embedder.ts
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

export async function embedText(text: string): Promise<number[]> {
  const embedder = new OpenAIEmbeddings();
  return embedder.embedQuery(text);
}
