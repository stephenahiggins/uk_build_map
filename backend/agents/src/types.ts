// Shared types for agents
export type EvidenceItem = {
  timestamp: string; // ISO8601
  excerpt: string;
  sourceUrl: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  costVariance?: number; // 0.12 = 12% over
  scheduleVariance?: number; // 0.05 = 5% late
};

export type ProjectStatus = {
  id: string;
  name: string;
  status: 'green' | 'amber' | 'red';
  evidenceTimeline: EvidenceItem[];
  lastUpdated: string; // ISO8601
};
