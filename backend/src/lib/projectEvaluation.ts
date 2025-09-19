import { GoogleGenAI } from '@google/genai';

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
  model?: string;
  enableGoogleSearch?: boolean;
  mockResponse?: boolean;
};

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

function getClient(apiKey?: string) {
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;
  if (!resolvedKey) {
    throw new Error(
      'Missing Gemini API key. Provide options.apiKey or set GEMINI_API_KEY in the environment.'
    );
  }
  if (!cachedClient || cachedApiKey !== resolvedKey) {
    cachedClient = new GoogleGenAI({ apiKey: resolvedKey });
    cachedApiKey = resolvedKey;
  }
  return cachedClient;
}

function normaliseStatus(
  value: string | undefined | null
): 'Red' | 'Amber' | 'Green' {
  const cleaned = (value || '').trim().toLowerCase();
  if (cleaned.includes('red')) return 'Red';
  if (cleaned.includes('green')) return 'Green';
  return 'Amber';
}

function parseCoordinate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normaliseConfidence(value: unknown): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (typeof value !== 'string') return 'LOW';
  const cleaned = value.trim().toUpperCase();
  if (cleaned.includes('HIGH')) return 'HIGH';
  if (cleaned.includes('MED')) return 'MEDIUM';
  if (cleaned.includes('LOW')) return 'LOW';
  return 'LOW';
}

function buildEvidenceNarrative(items: EvidenceForEvaluation[]): string {
  if (!items.length) {
    return 'No evidence provided.';
  }
  return items
    .map((item, index) => {
      const title = item.title ? `Title: ${item.title}` : 'Title: (unknown)';
      const source = item.source
        ? `Source: ${item.source}`
        : 'Source: (unknown)';
      const url = item.sourceUrl ? `URL: ${item.sourceUrl}` : 'URL: (unknown)';
      const date = item.evidenceDate
        ? `Date: ${item.evidenceDate}`
        : 'Date: (unknown)';
      const summary = item.summary || item.rawText || 'No summary provided.';
      return `Evidence ${index + 1}:\n${title}\n${source}\n${url}\n${date}\nSummary: ${summary}`;
    })
    .join('\n\n');
}

export async function evaluateProjectWithGemini(
  request: ProjectEvaluationRequest,
  options?: ProjectEvaluationOptions
): Promise<ProjectEvaluationResult> {
  const { projectName, projectDescription, locale, evidence } = request;
  const {
    apiKey,
    model,
    enableGoogleSearch = true,
    mockResponse,
  } = options || {};

  if (mockResponse || process.env.MOCK_PROJECT_EVALUATION === 'true') {
    return {
      ragStatus: 'Amber',
      ragRationale: 'Mock evaluation used; real Gemini call skipped.',
      latitude: null,
      longitude: null,
      locationDescription: 'Mock location',
      locationSource: 'Mock',
      locationConfidence: 'LOW',
    };
  }

  const client = getClient(apiKey);
  const chosenModel = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const evidenceNarrative = buildEvidenceNarrative(evidence);
  const locationHint = locale ? `Primary search locale: ${locale}.` : '';

  const contents = `You are an infrastructure intelligence analyst verifying the real-world status and location of a project.\n\nProject name: ${
    projectName || '(unknown)'
  }\nProject description: ${projectDescription || '(not provided)'}\n${locationHint}\n\nEvidence timeline:\n${evidenceNarrative}\n\nTasks:\n1. Decide the current overall RAG status (Red, Amber or Green) using the evidence above. If not enough evidence exists, the status should be Amber.\n2. Provide a concise rationale (<=60 words) referencing the strongest evidence.\n3. Identify the best available latitude and longitude for the primary project site. Use the evidence and, if needed, a quick web search of the project name plus location.\n4. Provide a short location description (e.g., town/landmark) and cite the main public source used.\n5. Provide your confidence in the coordinates as HIGH, MEDIUM or LOW.\n\nReturn only a single, valid JSON object with no other text or explanation. The JSON should conform to this exact schema:\n{\n  "ragStatus": "Red|Amber|Green",\n  "ragRationale": "text",\n  "latitude": number|null,\n  "longitude": number|null,\n  "locationDescription": "text",\n  "locationSource": "text",\n  "locationConfidence": "HIGH|MEDIUM|LOW"\n}\nIf you cannot determine coordinates, set latitude and longitude to null and explain why in the rationale or location description.`;

  const config = enableGoogleSearch
    ? {
        tools: [
          {
            googleSearch: {},
          },
        ],
      }
    : undefined;

  const response = await client.models.generateContent({
    model: chosenModel,
    contents,
    ...(config ? { config } : {}),
  });

  const text = (response.text || '').trim();
  let parsed: any;
  try {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
  }

  const ragStatus = normaliseStatus(parsed.ragStatus);
  const ragRationale = (parsed.ragRationale || parsed.rationale || '')
    .toString()
    .trim();
  const latitude = parseCoordinate(parsed.latitude);
  const longitude = parseCoordinate(parsed.longitude);
  const locationDescription = parsed.locationDescription
    ? parsed.locationDescription.toString().trim()
    : undefined;
  const locationSource = parsed.locationSource
    ? parsed.locationSource.toString().trim()
    : undefined;
  const locationConfidence = normaliseConfidence(parsed.locationConfidence);

  return {
    ragStatus,
    ragRationale,
    latitude,
    longitude,
    locationDescription,
    locationSource,
    locationConfidence,
  };
}
