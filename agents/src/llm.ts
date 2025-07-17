import Portkey from "portkey-ai";

/** Summarise text using the PortKey gateway */
export async function summarise(text: string): Promise<string> {
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
    messages: [{ role: "USER", content: `Summarise: ${text}` }],
  });

  // Handle response properly with type checking
  const content = res.choices[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

/**
 * Ask the model to assign a RAG status based on provided evidence text.
 */
export async function evaluateRag(text: string): Promise<"RED" | "AMBER" | "GREEN"> {
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
    messages: [
      { role: "system", content: "Return only one word: RED, AMBER or GREEN." },
      {
        role: "USER",
        content: `Given the following evidence determine a project status:\n${text}`,
      },
    ],
  });

  // Handle response properly with type checking
  const content = res.choices[0]?.message?.content;
  const contentStr = typeof content === "string" ? content.trim().toUpperCase() : "";

  if (contentStr.includes("RED")) return "RED";
  if (contentStr.includes("GREEN")) return "GREEN";
  return "AMBER";
}
