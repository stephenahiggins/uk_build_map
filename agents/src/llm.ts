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

/**
 * Ask the model to assign a RAG status based on provided evidence text.
 */
export async function evaluateRag(text: string): Promise<'RED' | 'AMBER' | 'GREEN'> {
  const client = new Portkey({
    virtualKey: process.env.VIRTUAL_KEY || '',
    openAIApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
  });

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return only one word: RED, AMBER or GREEN.' },
      { role: 'user', content: `Given the following evidence determine a project status:\n${text}` },
    ],
  });

  const content = res.choices[0]?.message?.content?.trim().toUpperCase() || '';
  if (content.includes('RED')) return 'RED';
  if (content.includes('GREEN')) return 'GREEN';
  return 'AMBER';
}
