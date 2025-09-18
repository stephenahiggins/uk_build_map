export type ProjectFoundItem = {
  timestamp: string;
  sourceUrl: string;
  summary: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  rawText: string;
  // New evidence fields
  source: string;
  title: string;
  evidenceDate: string; // Date the evidence applies to
  gatheredDate: string; // Date the evidence was gathered
  gatheredBy: string; // Organisation or person who gathered the evidence
};

export type EvidenceRecord = {
  title: string;
  content: string;
  source: string;
  summary: string;
};

export type ProjectStatus = {
  id: string;
  authority: string;
  name: string;
  description: string;
  status: "Red" | "Amber" | "Green";
  statusRationale?: string;
  latitude?: number | null;
  longitude?: number | null;
  evidence: ProjectFoundItem[];
  lastUpdated: string;
  locationDescription?: string;
  locationSource?: string;
  locationConfidence?: "LOW" | "MEDIUM" | "HIGH" | null;
};
