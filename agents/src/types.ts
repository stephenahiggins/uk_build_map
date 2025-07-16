export interface Evidence {
  title: string;
  content: string;
  source: string;
}

export interface EvidenceRecord extends Evidence {
  summary: string;
}
