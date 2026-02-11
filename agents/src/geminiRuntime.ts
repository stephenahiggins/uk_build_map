import { GoogleGenAI } from "@google/genai";
import { applyRuntimeOverrides, envValues } from "./envValues";
import { log } from "./logger";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

let currentGeminiApiKey: string | undefined = envValues.GEMINI_API_KEY || undefined;
let aiClient: GoogleGenAI | null = currentGeminiApiKey
  ? new GoogleGenAI({ apiKey: currentGeminiApiKey })
  : null;

export function getGeminiApiKey(): string | undefined {
  return currentGeminiApiKey;
}

export function setGeminiApiKey(nextKey: string) {
  currentGeminiApiKey = nextKey;
  process.env.GEMINI_API_KEY = nextKey;
  aiClient = new GoogleGenAI({ apiKey: nextKey });
}

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient || !currentGeminiApiKey) {
    throw new Error("Gemini API key is missing. Set GEMINI_API_KEY or provide one when prompted.");
  }
  return aiClient;
}

export function isGeminiRateLimitError(err: unknown): boolean {
  const maybeAny = err as { status?: number; code?: number; message?: string; cause?: any };
  const status = maybeAny?.status ?? maybeAny?.code ?? maybeAny?.cause?.status;
  if (status === 429) return true;
  const message = (maybeAny?.message || "").toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("resource_exhausted")
  );
}

export async function handleGeminiRateLimit(
  label: string
): Promise<"retry" | "abort" | "switch-openai"> {
  if (!process.stdin.isTTY) {
    log(`[LLM] ${label}: non-interactive session, pausing for 60s before retry.`);
    await pause(60_000);
    return "retry";
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `Gemini limit hit during ${label}. Enter a new API key, or type "pause" (optionally "pause 120"), "openai" to switch providers, or "exit": `
    );
    const trimmed = answer.trim();
    if (!trimmed) {
      log("[LLM] No input provided, pausing for 60s.");
      await pause(60_000);
      return "retry";
    }
    if (trimmed.toLowerCase() === "openai") {
      applyRuntimeOverrides({ PROVIDER: "openai" });
      log("[LLM] Switched provider to OpenAI.");
      return "switch-openai";
    }
    if (trimmed.toLowerCase().startsWith("pause")) {
      const parts = trimmed.split(/\s+/);
      const seconds = parts.length > 1 ? Number(parts[1]) : 60;
      const delayMs = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60_000;
      log(`[LLM] Pausing for ${Math.round(delayMs / 1000)}s before retry.`);
      await pause(delayMs);
      return "retry";
    }
    if (trimmed.toLowerCase() === "exit") {
      return "abort";
    }
    setGeminiApiKey(trimmed);
    log("[LLM] Updated Gemini API key.");
    return "retry";
  } finally {
    rl.close();
  }
}

export async function generateContentWithRetry(
  label: string,
  request: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
) {
  while (true) {
    try {
      const client = getGeminiClient();
      return await client.models.generateContent(request);
    } catch (err) {
      if (!isGeminiRateLimitError(err)) {
        console.error(err);
        throw err;
      }
      const action = await handleGeminiRateLimit(label);
      if (action === "abort") {
        throw err;
      }
      if (action === "switch-openai") {
        throw new Error("SWITCH_TO_OPENAI");
      }
    }
  }
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
