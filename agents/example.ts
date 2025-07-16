import Portkey from 'portkey-ai';

/** Simple example that requests a summary from the AI Gateway */
export async function summarise(text: string) {
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

if (require.main === module) {
  summarise('Example project info').then(console.log).catch(console.error);
}
