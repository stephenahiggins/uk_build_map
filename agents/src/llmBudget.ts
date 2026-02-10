import { log } from "./logger";

type LlmBudgetInit = {
  noLlm: boolean;
  maxCalls?: number;
};

export type LlmBudget = {
  remaining: number | null;
  noLlm: boolean;
  consume: (label: string) => boolean;
  summary: () => string;
};

export function createLlmBudget({ noLlm, maxCalls }: LlmBudgetInit): LlmBudget {
  const hasBudget = typeof maxCalls === "number" && !Number.isNaN(maxCalls) && maxCalls > 0;
  let remaining = hasBudget ? Math.floor(maxCalls) : null;

  const consume = (label: string) => {
    if (noLlm) {
      log(`[LLM] Skipping ${label} (NO_LLM enabled)`);
      return false;
    }
    if (remaining === null) return true;
    if (remaining <= 0) {
      log(`[LLM] Budget exhausted before ${label}`);
      return false;
    }
    remaining -= 1;
    log(`[LLM] Consumed 1 call for ${label}. Remaining: ${remaining}`);
    return true;
  };

  const summary = () => {
    if (noLlm) return "LLM disabled (NO_LLM=true)";
    if (remaining === null) return "LLM budget: unlimited";
    return `LLM budget: ${remaining} call(s) remaining`;
  };

  return { remaining, noLlm, consume, summary };
}
