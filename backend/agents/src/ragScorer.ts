// /agents/ragScorer.ts
import { z } from 'zod';
import { EvidenceItem } from './types';

export const EvidenceItemSchema = z.object({
  timestamp: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  costVariance: z.number().optional(),
  scheduleVariance: z.number().optional(),
});

export type RAGStatus = 'green' | 'amber' | 'red';

export function scoreRAG(evidence: EvidenceItem[]): { status: RAGStatus; explanation: string } {
  let cost = 0, schedule = 0, pos = 0, neg = 0;
  for (const e of evidence) {
    if (e.costVariance) cost += e.costVariance;
    if (e.scheduleVariance) schedule += e.scheduleVariance;
    if (e.sentiment === 'positive') pos++;
    if (e.sentiment === 'negative') neg++;
  }
  if (cost > 0.2 || schedule > 0.2 || neg > pos) {
    return {
      status: 'red',
      explanation: 'Major delay/overrun or negative sentiment. See timeline.',
    };
  }
  if (cost > 0.1 || schedule > 0.1) {
    return {
      status: 'amber',
      explanation: 'Minor slippage detected. See timeline.',
    };
  }
  return {
    status: 'green',
    explanation: 'On schedule and budget, positive sentiment.',
  };
}
