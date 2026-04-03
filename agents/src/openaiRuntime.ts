const OPENAI_DISABLED_MESSAGE =
  "OpenAI runtime is disabled in this repository. Use connectors-only workflows or the deterministic evaluator instead.";

export function getOpenAIApiKey(): string | undefined {
  return undefined;
}

export function setOpenAIApiKey(): never {
  throw new Error(OPENAI_DISABLED_MESSAGE);
}

export function getOpenAIClient(): never {
  throw new Error(OPENAI_DISABLED_MESSAGE);
}

export function isOpenAIRateLimitError(): boolean {
  return false;
}

export function isOpenAIQuotaError(): boolean {
  return false;
}

export async function handleOpenAIRateLimit(): Promise<"abort"> {
  return "abort";
}

export async function handleOpenAIQuota(): Promise<"abort"> {
  return "abort";
}

export async function generateOpenAIContentWithRetry(): Promise<never> {
  throw new Error(OPENAI_DISABLED_MESSAGE);
}
