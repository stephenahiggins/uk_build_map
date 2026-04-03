import { envValues, resolveProvider, type LlmProvider } from "./envValues";
import { generateContentWithRetry as generateGeminiContentWithRetry } from "./geminiRuntime";

export type GenerateContentRequest = {
  model?: string;
  contents: string;
  config?: {
    tools?: Array<Record<string, unknown>>;
  };
  enforceJson?: boolean;
};

export function resolveModelForProvider(provider: LlmProvider, override?: string): string {
  if (override && override.trim()) {
    return override.trim();
  }
  const explicitModel = process.env.MODEL ? envValues.MODEL : undefined;
  if (provider === "openai") {
    throw new Error("OpenAI runtime is disabled. Use Gemini or connector-only workflows.");
  }
  return envValues.GEMINI_MODEL || explicitModel || "gemini-2.5-flash";
}

function wantsWebSearch(request?: GenerateContentRequest): boolean {
  const tools = request?.config?.tools || [];
  return tools.some((tool) => Object.prototype.hasOwnProperty.call(tool, "googleSearch"));
}

export async function generateContentWithRetry(
  label: string,
  request: GenerateContentRequest,
  options?: { provider?: LlmProvider }
) {
  const provider = resolveProvider(options?.provider);
  const model = resolveModelForProvider(provider, request.model);

  if (provider === "openai") {
    throw new Error("OpenAI runtime is disabled. Use Gemini or connector-only workflows.");
  }

  try {
    return await generateGeminiContentWithRetry(label, {
      model,
      contents: request.contents,
      ...(request.config ? { config: request.config } : {}),
    });
  } catch (err) {
    throw err;
  }
}
