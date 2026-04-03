// Align with backend/prisma/schema.prisma ProjectType and EvidenceType
export const PROJECT_TYPE = {
  LOCAL_GOV: "LOCAL_GOV",
  NATIONAL_GOV: "NATIONAL_GOV",
  REGIONAL_GOV: "REGIONAL_GOV",
} as const;

export const PROJECT_STATUS = {
  RED: "RED",
  AMBER: "AMBER",
  GREEN: "GREEN",
} as const;

export const EVIDENCE_TYPE = {
  PDF: "PDF",
  URL: "URL",
  TEXT: "TEXT",
  DATE: "DATE",
} as const;

export type ProjectType = (typeof PROJECT_TYPE)[keyof typeof PROJECT_TYPE];
export type ProjectStatusConst = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
export type EvidenceType = (typeof EVIDENCE_TYPE)[keyof typeof EVIDENCE_TYPE];
