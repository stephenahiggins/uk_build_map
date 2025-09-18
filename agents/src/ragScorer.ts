import { ProjectFoundItem, ProjectStatus } from "./types/projectEvidence";
import { z } from "zod";
import { getProjectStatusWithGemini } from "./geminiService";

const Sentiment = z.union([z.literal("Positive"), z.literal("Neutral"), z.literal("Negative")]);

type SentimentType = z.infer<typeof Sentiment>;

function scoreFromEvidence(items: ProjectFoundItem[]): "Red" | "Amber" | "Green" {
  // simple rule: negative evidence with big delay triggers red
  const negatives = items.filter((i) => i.sentiment === "Negative");
  if (negatives.length >= 2) return "Red";
  if (negatives.length === 1) return "Amber";
  return "Green";
}

/**
 * Use Gemini with Google Search grounding to determine project status.
 */
export async function ragScore(project: ProjectStatus): Promise<"Red" | "Amber" | "Green"> {
  const ruleResult = scoreFromEvidence(project.evidence);
  if (ruleResult !== "Amber") return ruleResult;
  // Use Gemini with grounding for ambiguous cases
  return await getProjectStatusWithGemini(project);
}
