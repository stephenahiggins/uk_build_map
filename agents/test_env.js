import { envValues, validateEnvValues } from "./dist/chunk-YJRSP4T3.js";

console.log("Testing environment values...");
console.log("GEMINI_API_KEY:", envValues.GEMINI_API_KEY ? "Set" : "Not set");
console.log("DATABASE_URL:", envValues.DATABASE_URL ? "Set" : "Not set");
console.log("MODEL:", envValues.MODEL);
console.log("PROVIDER:", envValues.PROVIDER);
console.log("LOCALE:", envValues.LOCALE);
console.log("MAX_RESULTS:", envValues.MAX_RESULTS);

try {
  validateEnvValues();
  console.log("✅ Environment validation passed!");
} catch (error) {
  console.error("❌ Environment validation failed:", error.message);
}
