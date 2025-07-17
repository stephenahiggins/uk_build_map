import Portkey from "portkey-ai";

/** Simple example that requests a summary from the AI Gateway */
export async function summarise(text: string) {
  // Determine which provider to use based on DEFAULT_PROVIDER
  const defaultProvider = process.env.DEFAULT_PROVIDER || "OPEN_AI";
  const apiKey =
    defaultProvider === "GEMINI" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;

  const client = new Portkey({
    baseUrl: "https://api.portkey.ai",
    headers: {
      Authorization: `sk-${apiKey}`,
    },
  });

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: `Summarise: ${text}` }],
  });

  return res.choices[0]?.message?.content ?? "";
}

if (require.main === module) {
  summarise("Example project info").then(console.log).catch(console.error);
}
