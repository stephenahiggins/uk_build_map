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

// Centralized environment values with type safety
export const envValues = {
  // API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Application Configuration
  MODEL: process.env.MODEL || "gemini-2.5-flash",
  PROVIDER: process.env.PROVIDER || "google",
  LOCALE: process.env.LOCALE || "West Yorkshire",
  MAX_RESULTS: Number(process.env.MAX_RESULTS) || 5,

  // Testing and Development
  MOCK_EVIDENCE_ANALYSIS: process.env.MOCK_EVIDENCE_ANALYSIS === "true",
  MOCK_PROJECT_STATUS: process.env.MOCK_PROJECT_STATUS === "true",
  MOCK_INFRASTRUCTURE_SEARCH: process.env.MOCK_INFRASTRUCTURE_SEARCH === "true",
  MOCK_EVIDENCE_GATHERING: process.env.MOCK_EVIDENCE_GATHERING === "true",
  MOCK_PROJECT_EVALUATION: process.env.MOCK_PROJECT_EVALUATION === "true",
} as const;

// Validation function to ensure required environment variables are set
export function validateEnvValues(): void {
  if (!envValues.GEMINI_API_KEY && !envValues.OPENAI_API_KEY) {
    throw new Error(
      `Missing API Key: Please set either GEMINI_API_KEY or OPENAI_API_KEY in your .env file.`
    );
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
