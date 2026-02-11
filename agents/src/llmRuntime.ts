import { envValues, resolveProvider, type LlmProvider } from "./envValues";
import { generateContentWithRetry as generateGeminiContentWithRetry } from "./geminiRuntime";
import { generateOpenAIContentWithRetry } from "./openaiRuntime";

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
  if (provider === "gemini") {
    return envValues.GEMINI_MODEL || explicitModel || "gemini-2.5-flash";
  }
  return envValues.OPENAI_MODEL || explicitModel || "gpt-5-mini";
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
    return generateOpenAIContentWithRetry(label, {
      model,
      contents: request.contents,
      enableWebSearch: wantsWebSearch(request),
      enforceJson: request.enforceJson,
    });
  }

  try {
    return await generateGeminiContentWithRetry(label, {
      model,
      contents: request.contents,
      ...(request.config ? { config: request.config } : {}),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SWITCH_TO_OPENAI") {
      return generateOpenAIContentWithRetry(label, {
        model: resolveModelForProvider("openai"),
        contents: request.contents,
        enableWebSearch: wantsWebSearch(request),
      });
    }
    throw err;
  }
}
