import Portkey from 'portkey-ai';

/** Summarise text using the PortKey gateway */
export async function summarise(text: string): Promise<string> {
  const client = new Portkey({
    virtualKey: process.env.VIRTUAL_KEY || '',
    openAIApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
  });

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: `Summarise: ${text}` }],
  });

  return res.choices[0]?.message?.content ?? '';
}
