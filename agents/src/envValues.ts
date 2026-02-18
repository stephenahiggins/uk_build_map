import { config as dotenvConfig } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the project root (two levels up from src/)
const doteEnvPath = join(__dirname, "..", ".env");
console.log("Loading .env file from", doteEnvPath);
dotenvConfig({ path: doteEnvPath });

export type LlmProvider = "openai" | "gemini";

// Centralized environment values with type safety
export type EnvValues = {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_COMPAT_MODE?: string;
  OPENAI_WEB_SEARCH_MODEL?: string;
  DATABASE_URL?: string;
  MODEL: string;
  GEMINI_MODEL?: string;
  OPENAI_MODEL?: string;
  PROVIDER: string;
  LOCALE: string;
  MAX_RESULTS: number;
  CONNECTORS?: string;
  LOCAL_PROJECTS_JSON?: string;
  MOCK_EVIDENCE_ANALYSIS: boolean;
  MOCK_PROJECT_STATUS: boolean;
  MOCK_INFRASTRUCTURE_SEARCH: boolean;
  MOCK_EVIDENCE_GATHERING: boolean;
  MOCK_PROJECT_EVALUATION: boolean;
  NO_LLM: boolean;
  LLM_BUDGET?: number;
};

export const envValues: EnvValues = {
  // API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_COMPAT_MODE: process.env.OPENAI_COMPAT_MODE,
  OPENAI_WEB_SEARCH_MODEL: process.env.OPENAI_WEB_SEARCH_MODEL,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Application Configuration
  MODEL: process.env.MODEL || "gpt-5-mini",
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  PROVIDER: process.env.PROVIDER || "openai",
  LOCALE: process.env.LOCALE || "West Yorkshire",
  MAX_RESULTS: Number(process.env.MAX_RESULTS) || 5,
  CONNECTORS: process.env.CONNECTORS,
  LOCAL_PROJECTS_JSON: process.env.LOCAL_PROJECTS_JSON,

  // Testing and Development
  MOCK_EVIDENCE_ANALYSIS: process.env.MOCK_EVIDENCE_ANALYSIS === "true",
  MOCK_PROJECT_STATUS: process.env.MOCK_PROJECT_STATUS === "true",
  MOCK_INFRASTRUCTURE_SEARCH: process.env.MOCK_INFRASTRUCTURE_SEARCH === "true",
  MOCK_EVIDENCE_GATHERING: process.env.MOCK_EVIDENCE_GATHERING === "true",
  MOCK_PROJECT_EVALUATION: process.env.MOCK_PROJECT_EVALUATION === "true",
  NO_LLM: process.env.NO_LLM === "true",
  LLM_BUDGET: process.env.LLM_BUDGET ? Number(process.env.LLM_BUDGET) : undefined,
};

export function resolveProvider(value?: string): LlmProvider {
  const normalized = (value || envValues.PROVIDER || "").trim().toLowerCase();
  if (normalized.startsWith("gemini") || normalized.startsWith("google")) {
    return "gemini";
  }
  return "openai";
}

export function applyRuntimeOverrides(overrides: Partial<EnvValues>): void {
  Object.assign(envValues, overrides);
  if (overrides.GEMINI_API_KEY !== undefined) {
    process.env.GEMINI_API_KEY = overrides.GEMINI_API_KEY || "";
  }
  if (overrides.OPENAI_API_KEY !== undefined) {
    process.env.OPENAI_API_KEY = overrides.OPENAI_API_KEY || "";
  }
  if (overrides.OPENAI_BASE_URL !== undefined) {
    process.env.OPENAI_BASE_URL = overrides.OPENAI_BASE_URL || "";
  }
  if (overrides.OPENAI_COMPAT_MODE !== undefined) {
    process.env.OPENAI_COMPAT_MODE = overrides.OPENAI_COMPAT_MODE || "";
  }
  if (overrides.OPENAI_WEB_SEARCH_MODEL !== undefined) {
    process.env.OPENAI_WEB_SEARCH_MODEL = overrides.OPENAI_WEB_SEARCH_MODEL || "";
  }
  if (overrides.MODEL !== undefined) {
    process.env.MODEL = overrides.MODEL;
  }
  if (overrides.GEMINI_MODEL !== undefined) {
    process.env.GEMINI_MODEL = overrides.GEMINI_MODEL || "";
  }
  if (overrides.OPENAI_MODEL !== undefined) {
    process.env.OPENAI_MODEL = overrides.OPENAI_MODEL || "";
  }
  if (overrides.PROVIDER !== undefined) {
    process.env.PROVIDER = overrides.PROVIDER;
  }
}

// Validation function to ensure required environment variables are set
export function validateEnvValues(): void {
  if (!envValues.NO_LLM) {
    const provider = resolveProvider();
    if (provider === "gemini" && !envValues.GEMINI_API_KEY) {
      throw new Error(
        `Missing API Key: Please set GEMINI_API_KEY in your .env file (or switch provider to OpenAI).`
      );
    }
    if (provider === "openai" && !envValues.OPENAI_API_KEY) {
      throw new Error(
        `Missing API Key: Please set OPENAI_API_KEY in your .env file (or switch provider to Gemini).`
      );
    }
  }

  const requiredVars = [{ key: "DATABASE_URL", value: envValues.DATABASE_URL }];

  const missingVars = requiredVars.filter(({ value }) => !value);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.map((v) => v.key).join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set."
    );
  }
}
