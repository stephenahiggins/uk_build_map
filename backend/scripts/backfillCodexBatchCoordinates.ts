import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import {
  evaluateProjectDeterministically,
  EvidenceForEvaluation,
} from '../src/lib/projectEvaluation';

type EvidenceRow = {
  type?: string;
  title?: string;
  source?: string;
  url?: string;
  datePublished?: string;
  summary?: string;
  description?: string;
};

type BatchProject = {
  id?: string;
  title?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationDescription?: string;
  locationSource?: string;
  locationConfidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence?: EvidenceRow[];
  [key: string]: unknown;
};

type LocationEvaluation = {
  latitude: number | null;
  longitude: number | null;
  locationDescription?: string;
  locationSource?: string;
  locationConfidence?: 'LOW' | 'MEDIUM' | 'HIGH';
};

const DEFAULT_GLOB = path.join(process.cwd(), 'seeds', 'codex-batches', 'out', '*.json');
const FINALIZED_BATCH_FILE = /^batch-\d{3}\.json$/;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2';
const MAX_EVIDENCE_ITEMS = 6;
const MAX_TEXT_LENGTH = 1200;
const UK_BOUNDS = {
  minLatitude: 49,
  maxLatitude: 61,
  minLongitude: -9,
  maxLongitude: 3,
};

function parseArgs() {
  const argv = process.argv.slice(2);
  let globPattern = DEFAULT_GLOB;
  let overwriteExisting = false;
  let dryRun = false;
  let model = DEFAULT_MODEL;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: ts-node scripts/backfillCodexBatchCoordinates.ts [options]

Evaluates finalized Codex batch output files and writes missing latitude/longitude
plus location metadata back into the JSON arrays in place.

Options:
  --glob <pattern>       Batch file glob (default: seeds/codex-batches/out/*.json)
  --model <model>        OpenAI model to use (default: ${DEFAULT_MODEL})
  --overwrite-existing   Re-evaluate rows even when lat/lng already exist
  --dry-run              Report planned changes without writing files

Env:
  OPENAI_API_KEY         Required unless every missing project resolves deterministically
  OPENAI_MODEL           Default model override
`);
      process.exit(0);
    }
    if (arg === '--glob' && argv[i + 1]) {
      globPattern = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (arg === '--model' && argv[i + 1]) {
      model = argv[++i];
      continue;
    }
    if (arg === '--overwrite-existing') {
      overwriteExisting = true;
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  return { globPattern, overwriteExisting, dryRun, model };
}

function expandGlob(pattern: string): string[] {
  const directory = path.dirname(pattern);
  const basename = path.basename(pattern);
  const [prefix, suffix] = basename.split('*');
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .filter((file) => file.startsWith(prefix) && file.endsWith(suffix || ''))
    .filter((file) => FINALIZED_BATCH_FILE.test(file))
    .map((file) => path.join(directory, file))
    .sort();
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasCoordinates(project: BatchProject): boolean {
  return isFiniteNumber(project.latitude) && isFiniteNumber(project.longitude);
}

function isWithinUkBounds(latitude: number, longitude: number): boolean {
  return (
    latitude >= UK_BOUNDS.minLatitude &&
    latitude <= UK_BOUNDS.maxLatitude &&
    longitude >= UK_BOUNDS.minLongitude &&
    longitude <= UK_BOUNDS.maxLongitude
  );
}

function normalizeLocationConfidence(value?: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (value === 'HIGH' || value === 'MEDIUM') return value;
  return 'LOW';
}

function trimText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_TEXT_LENGTH);
}

function toEvaluationEvidence(project: BatchProject): EvidenceForEvaluation[] {
  const evidenceRows = Array.isArray(project.evidence) ? project.evidence : [];
  return evidenceRows.slice(0, MAX_EVIDENCE_ITEMS).map((item) => ({
    title: trimText(item.title),
    summary: trimText(item.summary),
    source: trimText(item.source),
    sourceUrl: trimText(item.url),
    evidenceDate: trimText(item.datePublished),
    rawText: trimText(item.description),
  }));
}

function deterministicLocation(project: BatchProject): LocationEvaluation {
  const evaluation = evaluateProjectDeterministically({
    projectName: trimText(project.title) || 'Unknown project',
    projectDescription: trimText(project.description),
    locale: trimText(project.locationDescription),
    evidence: toEvaluationEvidence(project),
  });

  return {
    latitude: evaluation.latitude,
    longitude: evaluation.longitude,
    locationDescription: evaluation.locationDescription,
    locationSource: evaluation.locationSource,
    locationConfidence: evaluation.locationConfidence,
  };
}

function buildLocationPrompt(project: BatchProject): string {
  const evidence = (Array.isArray(project.evidence) ? project.evidence : [])
    .slice(0, MAX_EVIDENCE_ITEMS)
    .map((item, index) => ({
      index: index + 1,
      title: trimText(item.title),
      source: trimText(item.source),
      url: trimText(item.url),
      datePublished: trimText(item.datePublished),
      summary: trimText(item.summary),
      description: trimText(item.description),
    }));

  return JSON.stringify(
    {
      task: 'Infer a single representative UK latitude/longitude for this project.',
      requirements: [
        'Return only valid JSON.',
        'Use a specific site centroid when the project clearly names a site or facility.',
        'If the evidence only supports a town or district, return a representative central point for that place.',
        'If the location is too ambiguous, return latitude and longitude as null.',
        'Coordinates must be in the UK.',
        'locationConfidence must be one of HIGH, MEDIUM, LOW.',
      ],
      outputSchema: {
        latitude: 'number|null',
        longitude: 'number|null',
        locationDescription: 'string',
        locationSource: 'string',
        locationConfidence: 'HIGH|MEDIUM|LOW',
      },
      project: {
        id: project.id,
        title: trimText(project.title),
        description: trimText(project.description),
        currentLocationDescription: trimText(project.locationDescription),
        currentLocationSource: trimText(project.locationSource),
      },
      evidence,
    },
    null,
    2
  );
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function evaluateWithOpenAI(
  client: OpenAI,
  model: string,
  project: BatchProject
): Promise<LocationEvaluation> {
  const completion = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You infer UK project locations from evidence. Return only a JSON object with latitude, longitude, locationDescription, locationSource, and locationConfidence.',
      },
      {
        role: 'user',
        content: buildLocationPrompt(project),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  const parsed = typeof content === 'string' ? parseJsonObject(content) : null;
  if (!parsed) {
    throw new Error(`Model did not return a valid JSON object for project ${project.id || project.title}`);
  }

  const latitude = typeof parsed.latitude === 'number' ? parsed.latitude : null;
  const longitude = typeof parsed.longitude === 'number' ? parsed.longitude : null;
  if (latitude !== null && longitude !== null && !isWithinUkBounds(latitude, longitude)) {
    throw new Error(
      `Model returned out-of-bounds coordinates (${latitude}, ${longitude}) for project ${project.id || project.title}`
    );
  }

  return {
    latitude,
    longitude,
    locationDescription: trimText(parsed.locationDescription),
    locationSource: trimText(parsed.locationSource),
    locationConfidence: normalizeLocationConfidence(
      typeof parsed.locationConfidence === 'string' ? parsed.locationConfidence : undefined
    ),
  };
}

function mergeLocation(
  project: BatchProject,
  location: LocationEvaluation
): { nextProject: BatchProject; changed: boolean } {
  const nextProject: BatchProject = { ...project };

  if (location.latitude !== null && location.longitude !== null) {
    nextProject.latitude = location.latitude;
    nextProject.longitude = location.longitude;
  } else {
    nextProject.latitude = null;
    nextProject.longitude = null;
  }

  if (location.locationDescription) {
    nextProject.locationDescription = location.locationDescription;
  }
  if (location.locationSource) {
    nextProject.locationSource = location.locationSource;
  }
  if (location.locationConfidence) {
    nextProject.locationConfidence = location.locationConfidence;
  }

  const changed =
    nextProject.latitude !== project.latitude ||
    nextProject.longitude !== project.longitude ||
    nextProject.locationDescription !== project.locationDescription ||
    nextProject.locationSource !== project.locationSource ||
    nextProject.locationConfidence !== project.locationConfidence;

  return { nextProject, changed };
}

async function main() {
  const { globPattern, overwriteExisting, dryRun, model } = parseArgs();
  const files = expandGlob(globPattern);

  if (files.length === 0) {
    console.log(`No finalized batch files matched ${globPattern}`);
    return;
  }

  let client: OpenAI | null = null;
  let filesUpdated = 0;
  let projectUpdates = 0;
  let deterministicUpdates = 0;
  let modelUpdates = 0;
  let modelFailures = 0;
  let skippedProjects = 0;

  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown;
    if (!Array.isArray(payload)) {
      console.warn(`Skipping ${file}: root is not a JSON array`);
      continue;
    }

    let fileChanged = false;
    const nextPayload: BatchProject[] = [];

    for (const rawProject of payload) {
      const project = (rawProject || {}) as BatchProject;

      if (!overwriteExisting && hasCoordinates(project)) {
        skippedProjects += 1;
        nextPayload.push(project);
        continue;
      }

      const deterministic = deterministicLocation(project);
      if (
        deterministic.latitude !== null &&
        deterministic.longitude !== null &&
        isWithinUkBounds(deterministic.latitude, deterministic.longitude)
      ) {
        const merged = mergeLocation(project, deterministic);
        nextPayload.push(merged.nextProject);
        if (merged.changed) {
          fileChanged = true;
          projectUpdates += 1;
          deterministicUpdates += 1;
        }
        continue;
      }

      if (!process.env.OPENAI_API_KEY) {
        nextPayload.push(project);
        console.warn(
          `Skipping model backfill for ${project.id || project.title || 'unknown project'}: OPENAI_API_KEY is not set`
        );
        continue;
      }

      if (!client) {
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      }

      try {
        const location = await evaluateWithOpenAI(client, model, project);
        const merged = mergeLocation(project, location);
        nextPayload.push(merged.nextProject);
        if (merged.changed) {
          fileChanged = true;
          projectUpdates += 1;
          modelUpdates += 1;
        }
      } catch (error) {
        modelFailures += 1;
        nextPayload.push(project);
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `Model backfill failed for ${project.id || project.title || 'unknown project'}: ${message}`
        );
      }
    }

    if (fileChanged) {
      filesUpdated += 1;
      if (!dryRun) {
        fs.writeFileSync(file, `${JSON.stringify(nextPayload, null, 2)}\n`, 'utf-8');
      }
    }

    console.log(
      `${dryRun ? 'Scanned' : 'Processed'} ${path.relative(process.cwd(), file)}: ${fileChanged ? 'updated' : 'unchanged'}`
    );
  }

  console.log(
    `Coordinate backfill complete. Files updated: ${filesUpdated}, projects updated: ${projectUpdates}, deterministic: ${deterministicUpdates}, model: ${modelUpdates}, model failures: ${modelFailures}, skipped with existing coords: ${skippedProjects}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
