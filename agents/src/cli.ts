import { Command } from "commander";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ragScore } from "./ragScorer";
import { upsertProject } from "./store";
import { ProjectStatus, ProjectFoundItem } from "./types/projectEvidence";
import { searchInfrastructureProjects, gatherEvidenceWithGemini } from "./geminiService";
import { validateEnvValues } from "./envValues";

// Global logging setup (truncated each run when main invoked directly)
const globalLogFilePath = path.resolve(process.cwd(), "cli.log");
fs.writeFileSync(globalLogFilePath, "");
const globalLogStream = fs.createWriteStream(globalLogFilePath, { flags: "a" });
function log(...args: any[]) {
  const msg = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a, null, 2))).join(" ");
  console.log(...args);
  globalLogStream.write(msg + "\n");
}
export { log };

type CliOptions = {
  locale?: string;
  limit?: number; // how many projects to process
  fetch?: number; // minimum projects to fetch
  maxEvidence?: number; // evidence items per project
  concurrency?: number; // parallel workers
};

type InfrastructureProject = Awaited<
  ReturnType<typeof searchInfrastructureProjects>
>["projects"][number];

const FOCUS_THEMES = [
  "road and transport upgrades",
  "rail and station investment",
  "mass transit and bus priority schemes",
  "digital connectivity and broadband rollout",
  "energy, decarbonisation and EV charging",
  "water, flood resilience and drainage",
  "regeneration and town centre renewal",
  "public estate improvements (schools, hospitals, civic)",
  "utilities, waste management and environmental infrastructure",
] as const;

const MIN_PASS_TARGET = 25;
const MAX_ATTEMPTS_PER_LOCALE = 4;
const EXISTING_TITLE_PROMPT_COUNT = 60;

function resolveSearchLocales(localeInput: string): string[] {
  const trimmed = localeInput.trim();
  const segments = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const uniqueSegments: string[] = [];
  for (const segment of segments) {
    if (!uniqueSegments.includes(segment)) {
      uniqueSegments.push(segment);
    }
  }

  if (!uniqueSegments.length) {
    return trimmed ? [trimmed] : [];
  }

  if (uniqueSegments.length === 1) {
    return uniqueSegments;
  }

  const result: string[] = trimmed ? [trimmed] : [];
  for (const segment of uniqueSegments) {
    if (!result.includes(segment)) {
      result.push(segment);
    }
  }
  return result;
}

function normalizeProjectTitle(title: string): string {
  return title
    ? title
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    : "";
}

async function collectProjectsAcrossLocales(locales: string[], minFetch: number) {
  const searchLocales = locales.map((locale) => locale.trim()).filter(Boolean);
  if (!searchLocales.length) {
    throw new Error("No valid locales provided for search");
  }

  const uniqueProjects: InfrastructureProject[] = [];
  const seenTitles = new Set<string>();
  const seenOriginalTitles: string[] = [];
  const summaryByLocale = new Map<string, string[]>();
  const countsByLocale = new Map<string, number>();

  const baseTarget = Math.max(
    MIN_PASS_TARGET,
    searchLocales.length ? Math.ceil(minFetch / searchLocales.length) : minFetch
  );

  let focusIndex = 0;
  const nextFocus = () => {
    if (!FOCUS_THEMES.length) return undefined;
    const focus = FOCUS_THEMES[focusIndex % FOCUS_THEMES.length];
    focusIndex += 1;
    return focus;
  };

  const appendSummary = (locale: string, summary?: string) => {
    if (!summary) return;
    const trimmedSummary = summary.trim();
    if (!trimmedSummary) return;
    const existing = summaryByLocale.get(locale) ?? [];
    existing.push(trimmedSummary);
    summaryByLocale.set(locale, existing);
  };

  const absorbProjects = (locale: string, projects: InfrastructureProject[]) => {
    if (!projects.length) return;
    const trimmedLocale = locale.trim();
    let addedCount = countsByLocale.get(trimmedLocale) ?? 0;
    for (const project of projects) {
      const normalized = normalizeProjectTitle(project.title);
      if (!normalized || seenTitles.has(normalized)) continue;
      seenTitles.add(normalized);
      uniqueProjects.push(project);
      seenOriginalTitles.push(project.title);
      addedCount += 1;
    }
    countsByLocale.set(trimmedLocale, addedCount);
  };

  const requestBatch = async (locale: string, target: number, focus?: string | null) => {
    const trimmedLocale = locale.trim();
    const focusHint = focus === null ? undefined : focus ?? nextFocus();
    const existing = seenOriginalTitles.slice(-EXISTING_TITLE_PROMPT_COUNT);
    log(
      `[Search] Requesting ≥${target} projects for ${trimmedLocale}${
        focusHint ? ` (focus: ${focusHint})` : ""
      } excluding ${existing.length} known titles`
    );
    const result = await searchInfrastructureProjects(trimmedLocale, target, existing, focusHint);
    log(`[Search] ${trimmedLocale} returned ${result.projects.length} project(s)`);
    appendSummary(trimmedLocale, result.summary);
    absorbProjects(trimmedLocale, result.projects);
  };

  for (const locale of searchLocales) {
    await requestBatch(locale, baseTarget);
  }

  const maxExtraAttempts = Math.max(0, MAX_ATTEMPTS_PER_LOCALE - 1) * searchLocales.length;
  let extraAttempts = 0;
  while (uniqueProjects.length < minFetch && extraAttempts < maxExtraAttempts) {
    const locale = searchLocales[extraAttempts % searchLocales.length];
    const remaining = minFetch - uniqueProjects.length;
    const target = Math.max(baseTarget, remaining);
    await requestBatch(locale, target);
    extraAttempts += 1;
  }

  let fallbackAttempts = 0;
  while (uniqueProjects.length < minFetch && fallbackAttempts < searchLocales.length) {
    const locale = searchLocales[fallbackAttempts % searchLocales.length];
    const remaining = minFetch - uniqueProjects.length;
    await requestBatch(locale, Math.max(MIN_PASS_TARGET, remaining), null);
    fallbackAttempts += 1;
  }

  if (uniqueProjects.length < minFetch) {
    log(
      `[Search] Warning: aggregated ${uniqueProjects.length} unique project(s) but target was ${minFetch}.`
    );
  }

  const summary = searchLocales
    .map((locale) => {
      const trimmedLocale = locale.trim();
      const localeSummaries = summaryByLocale.get(trimmedLocale) ?? [];
      const uniqueSummaries = Array.from(new Set(localeSummaries));
      const count = countsByLocale.get(trimmedLocale) ?? 0;
      if (!uniqueSummaries.length) {
        return `${trimmedLocale}: ${count} unique projects (no summary returned)`;
      }
      return `${trimmedLocale}: ${count} unique projects | ${uniqueSummaries.join(" | ")}`;
    })
    .join(" || ");

  log(
    `[Search] Aggregated ${uniqueProjects.length} unique project(s) across ${searchLocales.length} search area(s).`
  );

  return { projects: uniqueProjects, summary };
}

export async function main(cliOpts?: CliOptions) {
  validateEnvValues();
  log("Starting CLI with options:", cliOpts);
  await run(cliOpts || {});
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const program = new Command();
  program
    .option(
      "-l, --locale <locale>",
      "local region to search for infrastructure projects",
      "West Yorkshire"
    )
    .option("-n, --limit <number>", "max projects to process (default: all fetched)")
    .option(
      "-f, --fetch <number>",
      "minimum number of projects to fetch from model (default: 100)",
      "100"
    )
    .option(
      "-e, --max-evidence <number>",
      "max evidence items to gather per project (default: 10)",
      "10"
    )
    .option(
      "-c, --concurrency <number>",
      "number of projects to process concurrently (default: 3)",
      "3"
    );

  program.parse(process.argv);
  const opts = program.opts();
  if (opts.limit) opts.limit = parseInt(opts.limit, 10);
  if (opts.fetch) opts.fetch = parseInt(opts.fetch, 10);
  if (opts.maxEvidence) opts.maxEvidence = parseInt(opts.maxEvidence, 10);
  if (opts.concurrency) opts.concurrency = parseInt(opts.concurrency, 10);
  main(opts as CliOptions);
}

async function run(opts: CliOptions) {
  if (!opts.locale) throw new Error("You must specify a locale using --locale or -l");
  const locale = opts.locale;
  const searchLocales = resolveSearchLocales(locale);
  if (!searchLocales.length) throw new Error("No valid locale segments derived from input");

  log("Searching for infrastructure projects in", locale);
  if (searchLocales.length > 1) {
    log("Derived search areas:", searchLocales.join(", "));
  }

  const minFetch = opts.fetch ?? opts.limit ?? 100;
  log(`Targeting at least ${minFetch} unique projects`);
  const searchResults = await collectProjectsAcrossLocales(searchLocales, minFetch);
  log(`Found ${searchResults.projects.length} unique infrastructure projects`);

  const processedProjects: ProjectStatus[] = [];
  const toProcess =
    opts.limit && opts.limit > 0
      ? searchResults.projects.slice(0, opts.limit)
      : searchResults.projects;
  const maxEvidencePerProject = opts.maxEvidence ?? 10;
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 3, 10));
  log(
    `Processing ${toProcess.length} projects (concurrency=${concurrency}, maxEvidence=${maxEvidencePerProject})`
  );

  const queue = [...toProcess];
  async function worker(id: number) {
    while (queue.length) {
      const project = queue.shift();
      if (!project) break;
      log(`[W${id}] Gathering ${maxEvidencePerProject} evidence pieces for ${project.title}`);
      try {
        await processSingleProject(project, locale, maxEvidencePerProject, processedProjects);
      } catch (e: any) {
        log(`[W${id}] Error processing ${project.title}:`, e?.message || e);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

  log(`\nCompleted processing ${processedProjects.length} infrastructure projects`);
  log("Search summary:", searchResults.summary);
}

async function processSingleProject(
  project: {
    title: string;
    description: string;
    status: string;
    source: string;
    url?: string;
  },
  locale: string,
  maxEvidence: number,
  processedProjects: ProjectStatus[]
) {
  const evidenceResults = await gatherEvidenceWithGemini(
    project.title,
    project.description,
    locale,
    maxEvidence
  );
  const evidenceItems: ProjectFoundItem[] = evidenceResults.evidence.map((e) => ({
    timestamp: e.gatheredDate,
    sourceUrl: e.sourceUrl,
    summary: e.summary,
    sentiment: "Neutral",
    rawText: e.rawText,
    source: e.source,
    title: e.title,
    evidenceDate: e.evidenceDate,
    gatheredDate: e.gatheredDate,
    gatheredBy: e.gatheredBy,
  }));

  log(`\nEvidence gathered for ${project.title}:`);
  log(`\nNumber of evidence items: ${evidenceItems.length}`);
  evidenceItems.forEach((ev, idx) => {
    log(`\nEvidence ${idx + 1}:`);
    log(`  Title: ${ev.title}`);
    log(`  Source: ${ev.source}`);
    log(`  Date: ${ev.evidenceDate}`);
    log(`  Summary: ${ev.summary}`);
    log(`  URL: ${ev.sourceUrl}`);
    log(
      `  Raw Text: ${ev.rawText?.substring(0, 200)}${
        ev.rawText && ev.rawText.length > 200 ? "..." : ""
      }`
    );
  });

  const projectStatus: ProjectStatus = {
    id: `infrastructure-${project.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}`,
    authority: project.source,
    name: project.title,
    description: project.description,
    status: "Amber",
    evidence: evidenceItems,
    lastUpdated: new Date().toISOString(),
  };

  log(`RAG scoring project: ${project.title}...`);
  projectStatus.status = await ragScore(projectStatus);
  await upsertProject(projectStatus);
  processedProjects.push(projectStatus);
  log(`Project ${project.title} processed with status: ${projectStatus.status}`);
  log(`Evidence gathered: ${evidenceItems.length} items`);
}
// end processSingleProject
