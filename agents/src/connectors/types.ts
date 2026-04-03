export type ConnectorEvidence = {
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  evidenceDate: string;
  rawText?: string;
  sourceType?: string;
  sourceConfidence?: "LOW" | "MEDIUM" | "HIGH";
  urlVerified?: boolean;
};

export type ConnectorProject = {
  title: string;
  description: string;
  status?: string;
  source: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  localAuthority?: string;
  region?: string;
  updatedAt?: string;
  evidence?: ConnectorEvidence[];
  externalId?: string;
  location?: string;
  sourceType?: string;
  sourceConfidence?: "LOW" | "MEDIUM" | "HIGH";
  stagingOnly?: boolean;
};

export type ConnectorFetchResult = {
  projects: ConnectorProject[];
};

export type Connector = {
  name: string;
  supports: "public" | "private" | "mixed";
  fetchProjects: (since?: Date | null) => Promise<ConnectorFetchResult>;
};
