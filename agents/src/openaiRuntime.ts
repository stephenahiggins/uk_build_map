import OpenAI from "openai";
import { envValues } from "./envValues";
import { log } from "./logger";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

let currentOpenAIApiKey: string | undefined = envValues.OPENAI_API_KEY || undefined;
let aiClient: OpenAI | null = currentOpenAIApiKey
  ? new OpenAI({ apiKey: currentOpenAIApiKey })
  : null;

export function getOpenAIApiKey(): string | undefined {
  return currentOpenAIApiKey;
}

export function setOpenAIApiKey(nextKey: string) {
  currentOpenAIApiKey = nextKey;
  process.env.OPENAI_API_KEY = nextKey;
  aiClient = new OpenAI({ apiKey: nextKey });
}

export function getOpenAIClient(): OpenAI {
  if (!aiClient || !currentOpenAIApiKey) {
    throw new Error("OpenAI API key is missing. Set OPENAI_API_KEY or provide one when prompted.");
  }
  return aiClient;
}

export function isOpenAIRateLimitError(err: unknown): boolean {
  const maybeAny = err as { status?: number; code?: number; message?: string; cause?: any };
  const status = maybeAny?.status ?? maybeAny?.code ?? maybeAny?.cause?.status;
  if (status === 429) return true;
  const message = (maybeAny?.message || "").toLowerCase();
  return message.includes("rate limit") || message.includes("quota") || message.includes("too many");
}

export function isOpenAIQuotaError(err: unknown): boolean {
  const maybeAny = err as { status?: number; code?: number; message?: string; cause?: any };
  const status = maybeAny?.status ?? maybeAny?.code ?? maybeAny?.cause?.status;
  if (status === 402) return true;
  const message = (maybeAny?.message || "").toLowerCase();
  return message.includes("insufficient") || message.includes("credits") || message.includes("billing");
}

export async function handleOpenAIRateLimit(label: string): Promise<"retry" | "abort"> {
  if (!process.stdin.isTTY) {
    log(`[LLM] ${label}: non-interactive session, pausing for 60s before retry.`);
    await pause(60_000);
    return "retry";
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `OpenAI rate limit hit during ${label}. Press Enter to retry, enter a new API key, or type "pause" (optionally "pause 120"), or "exit": `
    );
    const trimmed = answer.trim();
    if (!trimmed) {
      log("[LLM] Retrying after 5s.");
      await pause(5_000);
      return "retry";
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
    setOpenAIApiKey(trimmed);
    log("[LLM] Updated OpenAI API key.");
    return "retry";
  } finally {
    rl.close();
  }
}

export async function handleOpenAIQuota(label: string): Promise<"retry" | "abort"> {
  if (!process.stdin.isTTY) {
    log(`[LLM] ${label}: OpenAI credits exhausted. Pausing 60s before retry.`);
    await pause(60_000);
    return "retry";
  }

  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `OpenAI credits exhausted during ${label}. Top up your OpenAI account, then press Enter to retry, enter a new API key, or type \"exit\": `
    );
    const trimmed = answer.trim().toLowerCase();
    if (trimmed === "exit") {
      return "abort";
    }
    if (trimmed && trimmed !== "exit") {
      setOpenAIApiKey(trimmed);
      log("[LLM] Updated OpenAI API key.");
    }
    return "retry";
  } finally {
    rl.close();
  }
}

export async function generateOpenAIContentWithRetry(
  label: string,
  request: {
    model: string;
    contents: string;
    enableWebSearch?: boolean;
    enforceJson?: boolean;
  }
) {
  while (true) {
    try {
      const client = getOpenAIClient();
      const useJsonFormat = Boolean(request.enforceJson ?? !request.enableWebSearch);
      const response = await client.responses.create({
        model: request.model,
        input: request.contents,
        ...(useJsonFormat ? { text: { format: { type: "json_object" } } } : {}),
        ...(request.enableWebSearch
          ? {
              tools: [{ type: "web_search_preview" }],
            }
          : {}),
      });
      return { text: response.output_text || "" };
    } catch (err) {
      if (isOpenAIQuotaError(err)) {
        const action = await handleOpenAIQuota(label);
        if (action === "abort") {
          throw err;
        }
        continue;
      }
      if (!isOpenAIRateLimitError(err)) {
        console.error(err);
        throw err;
      }
      const action = await handleOpenAIRateLimit(label);
      if (action === "abort") {
        throw err;
      }
    }
  }
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
