// Prisma enum constants
export const PROJECT_TYPE = {
  LOCAL_GOV: "LOCAL_GOV",
  OTHER: "OTHER",
} as const;

export const PROJECT_STATUS = {
  RED: "RED",
  AMBER: "AMBER",
  GREEN: "GREEN",
} as const;

export const EVIDENCE_TYPE = {
  TEXT: "TEXT",
  PDF: "PDF",
  IMAGE: "IMAGE",
} as const;

// Type exports for type safety
export type ProjectType = (typeof PROJECT_TYPE)[keyof typeof PROJECT_TYPE];
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
export type EvidenceType = (typeof EVIDENCE_TYPE)[keyof typeof EVIDENCE_TYPE];
