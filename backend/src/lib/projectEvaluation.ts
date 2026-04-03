export type EvidenceForEvaluation = {
  title?: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  evidenceDate?: string;
  rawText?: string;
};

export type ProjectEvaluationRequest = {
  projectName: string;
  projectDescription?: string;
  locale?: string;
  evidence: EvidenceForEvaluation[];
};

export type ProjectEvaluationResult = {
  ragStatus: 'Red' | 'Amber' | 'Green';
  ragRationale: string;
  latitude: number | null;
  longitude: number | null;
  locationDescription?: string;
  locationSource?: string;
  locationConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type ProjectEvaluationOptions = {
  apiKey?: string;
  openAIApiKey?: string;
  model?: string;
  openAIModel?: string;
  mockResponse?: boolean;
};

type EvaluatedEvidence = {
  item: EvidenceForEvaluation;
  ageDays: number | null;
  recencyScore: number;
  sourceScore: number;
  positiveSignals: string[];
  cautionSignals: string[];
  negativeSignals: string[];
  signalScore: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const POSITIVE_PATTERNS = [
  /\bcompleted\b/i,
  /\bopened\b/i,
  /\bopening\b/i,
  /\boperational\b/i,
  /\bconstruction (?:has )?started\b/i,
  /\bwork (?:has )?started\b/i,
  /\bon track\b/i,
  /\bapproved\b/i,
  /\bawarded\b/i,
  /\bcontract awarded\b/i,
  /\bfunding secured\b/i,
  /\bplanning permission granted\b/i,
  /\bprocurement underway\b/i,
];

const CAUTION_PATTERNS = [
  /\bconsultation\b/i,
  /\bplanned\b/i,
  /\bproposed\b/i,
  /\boutline\b/i,
  /\bbusiness case\b/i,
  /\bsubject to\b/i,
  /\bawaiting\b/i,
  /\bseeking approval\b/i,
  /\bpreferred bidder\b/i,
  /\bunder review\b/i,
  /\bdelayed\b/i,
  /\bslipped\b/i,
  /\brisk\b/i,
];

const NEGATIVE_PATTERNS = [
  /\bcancelled\b/i,
  /\bcanceled\b/i,
  /\bwithdrawn\b/i,
  /\bscrapped\b/i,
  /\babandoned\b/i,
  /\bhalted\b/i,
  /\bpaused indefinitely\b/i,
  /\bjudicial review\b/i,
  /\binsolven/i,
  /\bfunding withdrawn\b/i,
];

const HIGH_CONFIDENCE_DOMAINS = [
  '.gov.uk',
  '.gov.scot',
  '.gov.wales',
  '.gov.ie',
  '.nhs.uk',
  'theplanner.co.uk',
  'planninginspectorate.gov.uk',
  'find-tender.service.gov.uk',
  'contractsfinder.service.gov.uk',
];

function normalizeWhitespace(value: string | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function toDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ageInDays(value?: string): number | null {
  const parsed = toDate(value);
  if (!parsed) return null;
  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / MS_PER_DAY));
}

function scoreRecency(days: number | null): number {
  if (days === null) return -1;
  if (days <= 180) return 3;
  if (days <= 365) return 2;
  if (days <= 540) return 1;
  if (days <= 730) return 0;
  return -2;
}

function scoreSource(item: EvidenceForEvaluation): number {
  const sourceText = `${item.sourceUrl || ''} ${item.source || ''}`.toLowerCase();
  if (HIGH_CONFIDENCE_DOMAINS.some((domain) => sourceText.includes(domain))) {
    return 3;
  }
  if (sourceText.includes('.org.uk') || sourceText.includes('.co.uk')) {
    return 2;
  }
  if (sourceText.includes('.com') || sourceText.includes('.org')) {
    return 1;
  }
  return 0;
}

function collectSignals(text: string, patterns: RegExp[]): string[] {
  return patterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source.replace(/\\b|\(\?:|\)|\\/g, ' ').trim());
}

function evaluateEvidence(item: EvidenceForEvaluation): EvaluatedEvidence {
  const text = normalizeWhitespace(
    [item.title, item.summary, item.rawText].filter(Boolean).join(' ')
  );
  const ageDays = ageInDays(item.evidenceDate);
  const recencyScore = scoreRecency(ageDays);
  const sourceScore = scoreSource(item);
  const positiveSignals = collectSignals(text, POSITIVE_PATTERNS);
  const cautionSignals = collectSignals(text, CAUTION_PATTERNS);
  const negativeSignals = collectSignals(text, NEGATIVE_PATTERNS);
  const signalScore =
    positiveSignals.length * 2 + cautionSignals.length * -1 + negativeSignals.length * -4;

  return {
    item,
    ageDays,
    recencyScore,
    sourceScore,
    positiveSignals,
    cautionSignals,
    negativeSignals,
    signalScore,
  };
}

function extractCoordinates(evidence: EvidenceForEvaluation[]): {
  latitude: number | null;
  longitude: number | null;
  locationSource?: string;
} {
  const coordinatePattern =
    /\b(-?[1-8]?\d(?:\.\d+)?)\s*,\s*(-?(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?)\b/;

  for (const item of evidence) {
    const haystack = `${item.summary || ''} ${item.rawText || ''} ${item.title || ''}`;
    const match = haystack.match(coordinatePattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    if (latitude < 49 || latitude > 61 || longitude < -9 || longitude > 3) continue;
    return {
      latitude,
      longitude,
      locationSource: item.sourceUrl || item.source || 'evidence text',
    };
  }

  return { latitude: null, longitude: null };
}

function inferLocationDescription(
  request: ProjectEvaluationRequest,
  sortedEvidence: EvaluatedEvidence[]
): string | undefined {
  const bestLocale = normalizeWhitespace(request.locale);
  if (bestLocale) return bestLocale;

  const top = sortedEvidence[0]?.item;
  const evidenceText = normalizeWhitespace(top?.title || top?.summary || top?.rawText);
  if (!evidenceText) return undefined;
  return evidenceText.slice(0, 80);
}

function buildRationale(
  status: 'Red' | 'Amber' | 'Green',
  scored: EvaluatedEvidence[],
  totalScore: number
): string {
  const strongest = scored.slice(0, 2);
  const evidenceRefs = strongest
    .map((entry, index) => {
      const age =
        entry.ageDays === null ? 'undated' : `${Math.round(entry.ageDays / 30) || 0}mo old`;
      const source = normalizeWhitespace(entry.item.source || entry.item.sourceUrl) || 'unknown source';
      return `Evidence ${index + 1} (${source}, ${age})`;
    })
    .join('; ');

  if (status === 'Green') {
    return `${evidenceRefs}. Recent credible delivery signals outweigh caution flags (score ${totalScore}).`;
  }
  if (status === 'Red') {
    return `${evidenceRefs}. Negative delivery signals dominate and no fresher counter-evidence offsets them (score ${totalScore}).`;
  }
  return `${evidenceRefs}. Evidence is mixed, stale, or incomplete, so the project remains amber (score ${totalScore}).`;
}

export function evaluateProjectDeterministically(
  request: ProjectEvaluationRequest,
  options?: ProjectEvaluationOptions
): ProjectEvaluationResult {
  if (options?.mockResponse) {
    return {
      ragStatus: 'Amber',
      ragRationale: 'Mock evaluation used; deterministic scoring skipped.',
      latitude: null,
      longitude: null,
      locationDescription: request.locale || 'Unknown location',
      locationSource: 'mock',
      locationConfidence: 'LOW',
    };
  }

  const scored = request.evidence.map(evaluateEvidence);
  const sortedEvidence = [...scored].sort((left, right) => {
    const leftScore = left.signalScore + left.recencyScore + left.sourceScore;
    const rightScore = right.signalScore + right.recencyScore + right.sourceScore;
    return rightScore - leftScore;
  });

  const totalScore = scored.reduce(
    (sum, entry) => sum + entry.signalScore + entry.recencyScore + entry.sourceScore,
    0
  );
  const negativeCount = scored.reduce((sum, entry) => sum + entry.negativeSignals.length, 0);
  const positiveCount = scored.reduce((sum, entry) => sum + entry.positiveSignals.length, 0);
  const freshStrongEvidence = scored.some(
    (entry) =>
      entry.ageDays !== null &&
      entry.ageDays <= 365 &&
      entry.sourceScore >= 2 &&
      entry.positiveSignals.length > 0
  );

  let ragStatus: 'Red' | 'Amber' | 'Green' = 'Amber';
  if (negativeCount >= 2 || totalScore <= -4) {
    ragStatus = 'Red';
  } else if (freshStrongEvidence && positiveCount >= negativeCount && totalScore >= 5) {
    ragStatus = 'Green';
  }

  const coordinates = extractCoordinates(request.evidence);
  const locationDescription = inferLocationDescription(request, sortedEvidence);
  const locationConfidence =
    coordinates.latitude !== null && coordinates.longitude !== null ? 'MEDIUM' : 'LOW';

  return {
    ragStatus,
    ragRationale: buildRationale(ragStatus, sortedEvidence, totalScore),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    locationDescription,
    locationSource: coordinates.locationSource || locationDescription,
    locationConfidence,
  };
}

export async function evaluateProjectWithOpenAI(
  request: ProjectEvaluationRequest,
  options?: ProjectEvaluationOptions
): Promise<ProjectEvaluationResult> {
  return evaluateProjectDeterministically(request, options);
}

export async function evaluateProjectWithGemini(
  request: ProjectEvaluationRequest,
  options?: ProjectEvaluationOptions
): Promise<ProjectEvaluationResult> {
  return evaluateProjectDeterministically(request, options);
}
