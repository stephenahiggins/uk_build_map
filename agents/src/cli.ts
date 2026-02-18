import { Command } from "commander";
import { fileURLToPath } from "url";
import { getExistingProjectTitleMap, upsertProject } from "./store";
import { ProjectStatus, ProjectFoundItem } from "./types/projectEvidence";
import { searchInfrastructureProjects, gatherEvidenceWithGemini } from "./geminiService";
import {
  applyRuntimeOverrides,
  envValues,
  resolveProvider,
  type LlmProvider,
  validateEnvValues,
} from "./envValues";
import { migrateAgentsDataToBackend } from "./migrateBackend";
import { log } from "./logger";
import { normalizeProjectTitle } from "./utils/projectNormalization";
import {
  evaluateProjectWithGemini,
  evaluateProjectWithOpenAI,
} from "../../backend/src/lib/projectEvaluation";
import { createLlmBudget } from "./llmBudget";
import {
  getGeminiApiKey,
  handleGeminiRateLimit,
  isGeminiRateLimitError,
} from "./geminiRuntime";
import {
  getOpenAIApiKey,
  handleOpenAIRateLimit,
  isOpenAIRateLimitError,
} from "./openaiRuntime";
import { fetchFromConnectors, resolveConnectorNames } from "./connectors";
import type { ConnectorProject, ConnectorEvidence } from "./connectors/types";
import { listStageFiles, readStageFile, writeStageFile } from "./staging";
import { UK_LOCAL_AUTHORITIES } from "./data/ukLocalAuthorities";

type CliOptions = {
  locale?: string;
  limit?: number; // how many projects to process
  fetch?: number; // minimum projects to fetch
  maxEvidence?: number; // evidence items per project
  concurrency?: number; // parallel workers
  noLlm?: boolean;
  llmBudget?: number;
  ukWide?: boolean;
  connectors?: string;
  connectorsOnly?: boolean;
  since?: string;
  stage?: boolean;
  provider?: string;
  local?: boolean;
  localBaseUrl?: string;
};

type InfrastructureProject = Awaited<
  ReturnType<typeof searchInfrastructureProjects>
>["projects"][number];

async function loadStagedTitleSet(): Promise<Set<string>> {
  const stagedTitles = new Set<string>();
  const files = await listStageFiles();
  for (const file of files) {
    try {
      const payload = await readStageFile(file);
      for (const project of payload.projects) {
        const normalized = normalizeProjectTitle(project.name);
        if (normalized) {
          stagedTitles.add(normalized);
        }
      }
    } catch (err) {
      log(`[Stage] Failed to read staged file ${file}:`, err);
    }
  }
  return stagedTitles;
}

function parseScrapeCliOptions(raw: Record<string, any>): CliOptions {
  const parsed: CliOptions = { ...raw };
  if (raw.limit !== undefined) parsed.limit = parseInt(raw.limit, 10);
  if (raw.fetch !== undefined) parsed.fetch = parseInt(raw.fetch, 10);
  if (raw.maxEvidence !== undefined) parsed.maxEvidence = parseInt(raw.maxEvidence, 10);
  if (raw.concurrency !== undefined) parsed.concurrency = parseInt(raw.concurrency, 10);
  if (raw.llmBudget !== undefined) parsed.llmBudget = parseInt(raw.llmBudget, 10);
  if (raw.noLlm !== undefined) parsed.noLlm = Boolean(raw.noLlm);
  if (raw.ukWide !== undefined) parsed.ukWide = Boolean(raw.ukWide);
  if (raw.connectors !== undefined) parsed.connectors = String(raw.connectors);
  if (raw.connectorsOnly !== undefined) parsed.connectorsOnly = Boolean(raw.connectorsOnly);
  if (raw.since !== undefined) parsed.since = String(raw.since);
  if (raw.stage !== undefined) parsed.stage = Boolean(raw.stage);
  if (raw.provider !== undefined) parsed.provider = String(raw.provider);
  if (raw.local !== undefined) {
    parsed.local = Boolean(raw.local);
    if (typeof raw.local === "string" && raw.local.trim().length > 0) {
      parsed.localBaseUrl = raw.local.trim();
    }
  }
  return parsed;
}

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

const MAX_ATTEMPTS_PER_LOCALE = 4;
const EXISTING_TITLE_PROMPT_COUNT = 60;
const MAX_SEARCH_RETRIES = 3;
const UK_WIDE_BASE_LOCALES = [
  "United Kingdom",
  "England",
  "Scotland",
  "Wales",
  "Northern Ireland",
  "North East",
  "North West",
  "Yorkshire and the Humber",
  "East Midlands",
  "West Midlands",
  "East of England",
  "London",
  "South East",
  "South West",
];

const UK_WIDE_LOCALES = Array.from(
  new Set([...UK_WIDE_BASE_LOCALES, ...UK_LOCAL_AUTHORITIES])
);

const UK_GENERAL_HINTS = [
  "united kingdom",
  "uk",
  "great britain",
  "britain",
  "gb",
  "england",
  "scotland",
  "wales",
  "northern ireland",
];

// Guardrail: used only when we lack strong UK signals (coords/region/authority/UK domains)
// to cheaply filter obvious non-UK mentions without extra LLM calls.
const NON_UK_HINTS = [
  "afghanistan",
  "albania",
  "algeria",
  "andorra",
  "angola",
  "antigua and barbuda",
  "argentina",
  "armenia",
  "australia",
  "austria",
  "azerbaijan",
  "bahamas",
  "bahrain",
  "bangladesh",
  "barbados",
  "belarus",
  "belgium",
  "belize",
  "benin",
  "bhutan",
  "bolivia",
  "bosnia and herzegovina",
  "botswana",
  "brazil",
  "brunei",
  "bulgaria",
  "burkina faso",
  "burundi",
  "cabo verde",
  "cambodia",
  "cameroon",
  "canada",
  "central african republic",
  "chad",
  "chile",
  "china",
  "colombia",
  "comoros",
  "congo",
  "costa rica",
  "cote d'ivoire",
  "croatia",
  "cuba",
  "cyprus",
  "czech republic",
  "denmark",
  "djibouti",
  "dominica",
  "dominican republic",
  "ecuador",
  "egypt",
  "el salvador",
  "equatorial guinea",
  "eritrea",
  "estonia",
  "eswatini",
  "ethiopia",
  "fiji",
  "finland",
  "france",
  "gabon",
  "gambia",
  "georgia",
  "germany",
  "ghana",
  "greece",
  "grenada",
  "guatemala",
  "guinea",
  "guinea-bissau",
  "guyana",
  "haiti",
  "honduras",
  "hungary",
  "iceland",
  "india",
  "indonesia",
  "iran",
  "iraq",
  "ireland",
  "israel",
  "italy",
  "jamaica",
  "japan",
  "jordan",
  "kazakhstan",
  "kenya",
  "kiribati",
  "kuwait",
  "kyrgyzstan",
  "laos",
  "latvia",
  "lebanon",
  "lesotho",
  "liberia",
  "libya",
  "liechtenstein",
  "lithuania",
  "luxembourg",
  "madagascar",
  "malawi",
  "malaysia",
  "maldives",
  "mali",
  "malta",
  "marshall islands",
  "mauritania",
  "mauritius",
  "mexico",
  "micronesia",
  "moldova",
  "monaco",
  "mongolia",
  "montenegro",
  "morocco",
  "mozambique",
  "myanmar",
  "namibia",
  "nauru",
  "nepal",
  "netherlands",
  "new zealand",
  "nicaragua",
  "niger",
  "nigeria",
  "north korea",
  "north macedonia",
  "norway",
  "oman",
  "pakistan",
  "palau",
  "panama",
  "papua new guinea",
  "paraguay",
  "peru",
  "philippines",
  "poland",
  "portugal",
  "qatar",
  "romania",
  "russia",
  "rwanda",
  "saint kitts and nevis",
  "saint lucia",
  "saint vincent and the grenadines",
  "samoa",
  "san marino",
  "sao tome and principe",
  "saudi arabia",
  "senegal",
  "serbia",
  "seychelles",
  "sierra leone",
  "singapore",
  "slovakia",
  "slovenia",
  "solomon islands",
  "somalia",
  "south africa",
  "south korea",
  "south sudan",
  "spain",
  "sri lanka",
  "sudan",
  "suriname",
  "sweden",
  "switzerland",
  "syria",
  "taiwan",
  "tajikistan",
  "tanzania",
  "thailand",
  "timor-leste",
  "togo",
  "tonga",
  "trinidad and tobago",
  "tunisia",
  "turkey",
  "turkmenistan",
  "tuvalu",
  "uganda",
  "ukraine",
  "united arab emirates",
  "united states",
  "uruguay",
  "uzbekistan",
  "vanuatu",
  "venezuela",
  "vietnam",
  "yemen",
  "zambia",
  "zimbabwe",
  "us",
  "usa",
  "u.s.",
  "u.s.a.",
  "united states of america",
  "uae",
  "u.a.e.",
  "ukraine",
  "u.k.r.",
  "russia",
  "ru",
  "russian federation",
  "prc",
  "p.r.c.",
  "china",
  "roc",
  "r.o.c.",
  "taiwan",
  "drc",
  "d.r.c.",
  "congo-kinshasa",
  "congo-brazzaville",
  "ivory coast",
  "cote d’ivoire",
  "côte d'ivoire",
  "cote d'ivoire",
  "car",
  "c.a.r.",
  "south korea",
  "s. korea",
  "north korea",
  "n. korea",
  "lao",
  "laos",
  "vn",
  "viet nam",
  "br",
  "brazil",
  "mx",
  "mexico",
  "au",
  "australia",
  "nz",
  "new zealand",
  "sa",
  "south africa",
  "ua",
  "ukr",
  "eg",
  "egypt",
  "de",
  "germany",
  "fr",
  "france",
  "es",
  "spain",
  "it",
  "italy",
  "pt",
  "portugal",
  "pl",
  "poland",
  "ro",
  "romania",
  "cz",
  "czechia",
  "sk",
  "slovakia",
  "si",
  "slovenia",
  "se",
  "sweden",
  "no",
  "norway",
  "dk",
  "denmark",
  "fi",
  "finland",
  "ie",
  "ireland",
  "is",
  "iceland",
  "ch",
  "switzerland",
  "nl",
  "netherlands",
  "be",
  "belgium",
  "at",
  "austria",
  "gr",
  "greece",
  "tr",
  "turkey",
  "sa",
  "saudi arabia",
  "qa",
  "qatar",
  "kw",
  "kuwait",
  "om",
  "oman",
  "ir",
  "iran",
  "iq",
  "iraq",
  "il",
  "israel",
  "ps",
  "palestine",
  "af",
  "afghanistan",
  "pk",
  "pakistan",
  "in",
  "india",
  "lk",
  "sri lanka",
  "bd",
  "bangladesh",
  "mm",
  "myanmar",
  "th",
  "thailand",
  "sg",
  "singapore",
  "my",
  "malaysia",
  "id",
  "indonesia",
  "ph",
  "philippines",
  "jp",
  "japan",
  "kr",
  "korea",
  "cn",
  "china",
  "ca",
  "canada",
  "ar",
  "argentina",
  "cl",
  "chile",
  "co",
  "colombia",
  "pe",
  "peru",
  "ve",
  "venezuela",
  "uy",
  "uruguay",
  "py",
  "paraguay",
  "bo",
  "bolivia",
  "ec",
  "ecuador",
  "gt",
  "guatemala",
  "hn",
  "honduras",
  "sv",
  "el salvador",
  "ni",
  "nicaragua",
  "cr",
  "costa rica",
  "pa",
  "panama",
  "cu",
  "cuba",
  "do",
  "dominican republic",
  "ht",
  "haiti",
  "jm",
  "jamaica",
  "tt",
  "trinidad and tobago",
  "bb",
  "barbados",
  "bs",
  "bahamas",
  "uy",
  "uruguay",
  "zw",
  "zimbabwe",
  "za",
  "south africa",
  "ng",
  "nigeria",
  "ke",
  "kenya",
  "ug",
  "uganda",
  "tz",
  "tanzania",
  "et",
  "ethiopia",
  "gh",
  "ghana",
  "dz",
  "algeria",
  "ma",
  "morocco",
  "tn",
  "tunisia",
  "ly",
  "libya",
  "sd",
  "sudan",
  "ss",
  "south sudan",
  "cm",
  "cameroon",
  "ci",
  "cote d'ivoire",
  "sn",
  "senegal",
  "ml",
  "mali",
  "ne",
  "niger",
  "bf",
  "burkina faso",
  "gm",
  "gambia",
  "sl",
  "sierra leone",
  "lr",
  "liberia",
  "ga",
  "gabon",
  "cg",
  "congo",
  "cd",
  "democratic republic of the congo",
  "ao",
  "angola",
  "mz",
  "mozambique",
  "zm",
  "zambia",
  "bw",
  "botswana",
  "na",
  "namibia",
  "mw",
  "malawi",
  "rw",
  "rwanda",
  "bi",
  "burundi",
  "mg",
  "madagascar",
  "mu",
  "mauritius",
  "sc",
  "seychelles",
  "pg",
  "papua new guinea",
  "fj",
  "fiji",
  "sb",
  "solomon islands",
  "vu",
  "vanuatu",
  "ws",
  "samoa",
  "to",
  "tonga",
];

const UK_BOUNDS = {
  minLat: 49.5,
  maxLat: 60.9,
  minLng: -8.7,
  maxLng: 1.9,
};

function normalizePlace(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const UK_PLACE_SET = new Set(
  [...UK_WIDE_BASE_LOCALES, ...UK_LOCAL_AUTHORITIES]
    .map((place) => normalizePlace(place))
    .filter(Boolean)
);

const UK_TEXT_HINTS = new Set(
  [...UK_GENERAL_HINTS, ...UK_WIDE_BASE_LOCALES, ...UK_LOCAL_AUTHORITIES]
    .map((place) => normalizePlace(place))
    .filter(Boolean)
);

function isWithinUkBounds(latitude?: number, longitude?: number) {
  if (latitude == null || longitude == null) return false;
  return (
    latitude >= UK_BOUNDS.minLat &&
    latitude <= UK_BOUNDS.maxLat &&
    longitude >= UK_BOUNDS.minLng &&
    longitude <= UK_BOUNDS.maxLng
  );
}

function hasUkDomain(value?: string) {
  if (!value) return false;
  return /\.(uk|gov\.uk)\b/i.test(value);
}

function includesUkHints(text?: string) {
  if (!text) return false;
  const normalized = normalizePlace(text);
  if (!normalized) return false;
  for (const hint of UK_TEXT_HINTS) {
    if (hint && normalized.includes(hint)) return true;
  }
  return false;
}

function isLikelyUkProject(project: InfrastructureProject) {
  if (project.latitude != null && project.longitude != null) {
    return isWithinUkBounds(project.latitude, project.longitude);
  }
  if (project.region && UK_PLACE_SET.has(normalizePlace(project.region))) return true;
  if (project.localAuthority && UK_PLACE_SET.has(normalizePlace(project.localAuthority))) {
    return true;
  }
  if (hasUkDomain(project.url) || hasUkDomain(project.source)) return true;
  const titleHasUk = includesUkHints(project.title);
  const descHasUk = includesUkHints(project.description);
  if (titleHasUk || descHasUk) return true;
  const normalizedTitle = normalizePlace(project.title);
  const normalizedDesc = normalizePlace(project.description);
  const hasNonUkHint = NON_UK_HINTS.some(
    (hint) =>
      (normalizedTitle && normalizedTitle.includes(hint)) ||
      (normalizedDesc && normalizedDesc.includes(hint))
  );
  if (hasNonUkHint) return false;
  return false;
}

function resolveSearchLocales(localeInput: string, useUkWide: boolean): string[] {
  if (useUkWide) {
    return UK_WIDE_LOCALES;
  }
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

async function collectProjectsAcrossLocales(
  locales: string[],
  minFetch: number,
  llmBudget: ReturnType<typeof createLlmBudget>,
  knownTitles: string[] = []
) {
  const searchLocales = locales.map((locale) => locale.trim()).filter(Boolean);
  if (!searchLocales.length) {
    throw new Error("No valid locales provided for search");
  }

  const uniqueProjects: InfrastructureProject[] = [];
  const seenTitles = new Set<string>();
  const seenOriginalTitles: string[] = [];
  for (const title of knownTitles) {
    const normalized = normalizeProjectTitle(title) || title.trim();
    if (!normalized) continue;
    if (!seenTitles.has(normalized)) {
      seenTitles.add(normalized);
      seenOriginalTitles.push(title);
    }
  }
  const summaryByLocale = new Map<string, string[]>();
  const countsByLocale = new Map<string, number>();

  const baseTarget = Math.max(
    1,
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
    const canSearch = llmBudget.consume(`project search (${trimmedLocale})`);
    for (let attempt = 1; attempt <= MAX_SEARCH_RETRIES; attempt += 1) {
      try {
        const result = await searchInfrastructureProjects(
          trimmedLocale,
          target,
          existing,
          focusHint,
          { forceMock: !canSearch }
        );
        log(`[Search] ${trimmedLocale} returned ${result.projects.length} project(s)`);
        appendSummary(trimmedLocale, result.summary);
        absorbProjects(trimmedLocale, result.projects);
        return;
      } catch (err: any) {
        const message = err?.message || String(err);
        const causeCode = err?.cause?.code || err?.cause?.errno;
        log(
          `[Search] Error for ${trimmedLocale} (attempt ${attempt}/${MAX_SEARCH_RETRIES}):`,
          message,
          causeCode ? `cause=${causeCode}` : ""
        );
        if (attempt >= MAX_SEARCH_RETRIES) {
          log(`[Search] Skipping ${trimmedLocale} after ${MAX_SEARCH_RETRIES} failed attempts.`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    }
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
    await requestBatch(locale, Math.max(1, remaining), null);
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
  if (cliOpts?.provider) {
    applyRuntimeOverrides({ PROVIDER: resolveProvider(cliOpts.provider) });
  }
  if (cliOpts?.local || cliOpts?.localBaseUrl) {
    applyRuntimeOverrides({
      PROVIDER: "openai" satisfies LlmProvider,
      OPENAI_BASE_URL: cliOpts.localBaseUrl || "http://localhost:11434/v1",
      OPENAI_COMPAT_MODE: "ollama",
      OPENAI_API_KEY: envValues.OPENAI_API_KEY || "ollama",
    });
  }
  validateEnvValues();
  if (cliOpts?.ukWide) {
    log("Starting CLI with options:", { ...cliOpts, locale: "United Kingdom" });
  } else {
    log("Starting CLI with options:", cliOpts);
  }
  await run(cliOpts || {});
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const program = new Command();
  program
    .name("agents-cli")
    .description("Infrastructure scraping and migration toolkit");

  program
    .option(
      "-l, --locale <locale>",
      "local region to search for infrastructure projects",
      "West Yorkshire"
    )
    .option("--uk-wide", "run a UK-wide search across nations and English regions")
    .option("-n, --limit <number>", "max projects to process (default: all fetched)")
    .option(
      "-f, --fetch <number>",
      "minimum number of projects to fetch from model (default: 10)",
      "10"
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
    )
    .option("--no-llm", "disable LLM calls and use mock outputs where possible")
    .option(
      "--llm-budget <number>",
      "max LLM calls to spend before falling back to mock outputs"
    )
    .option(
      "--connectors <list>",
      "comma-separated connector list (e.g. local-json); falls back to CONNECTORS env"
    )
    .option("--connectors-only", "skip LLM discovery and rely on connectors only")
    .option("--since <date>", "incremental pull: only use connector data since YYYY-MM-DD")
    .option("--stage", "write results to staging instead of committing to the database")
    .option(
      "--provider <provider>",
      "LLM provider to use (openai|gemini); overrides PROVIDER env var"
    )
    .option(
      "--local [baseUrl]",
      "use a local OpenAI-compatible endpoint (default: http://localhost:11434/v1)"
    )
    .action(async (rawOpts) => {
      const parsed = parseScrapeCliOptions(rawOpts);
      await main(parsed);
    });

  program
    .command("loop")
    .description("Run a UK-wide backfill followed by incremental refresh cycles")
    .option("--uk-wide", "run a UK-wide search across nations and English regions")
    .option("--backfill-fetch <number>", "backfill fetch target", "200")
    .option("--incremental-fetch <number>", "incremental fetch target", "50")
    .option(
      "--interval-hours <number>",
      "repeat incremental runs every N hours (omit to run once)"
    )
    .option("--no-llm", "disable LLM calls and use mock outputs where possible")
    .option(
      "--llm-budget <number>",
      "max LLM calls to spend before falling back to mock outputs"
    )
    .option(
      "--connectors <list>",
      "comma-separated connector list (e.g. local-json); falls back to CONNECTORS env"
    )
    .option("--connectors-only", "skip LLM discovery and rely on connectors only")
    .option(
      "--provider <provider>",
      "LLM provider to use (openai|gemini); overrides PROVIDER env var"
    )
    .option(
      "--local [baseUrl]",
      "use a local OpenAI-compatible endpoint (default: http://localhost:11434/v1)"
    )
    .option("-e, --max-evidence <number>", "max evidence items to gather per project", "5")
    .option("-c, --concurrency <number>", "number of projects to process concurrently", "3")
    .action(async (rawOpts) => {
      const parsed = parseScrapeCliOptions(rawOpts);
      const backfillFetch = rawOpts.backfillFetch ? parseInt(rawOpts.backfillFetch, 10) : 200;
      const incrementalFetch = rawOpts.incrementalFetch
        ? parseInt(rawOpts.incrementalFetch, 10)
        : 50;
      const intervalHours = rawOpts.intervalHours
        ? parseFloat(rawOpts.intervalHours)
        : undefined;

      const baseOpts: CliOptions = {
        ...parsed,
        ukWide: Boolean(rawOpts.ukWide ?? parsed.ukWide),
      };

      log("Starting backfill run...");
      await main({
        ...baseOpts,
        fetch: backfillFetch,
      });

      const runIncremental = async () => {
        log("Starting incremental refresh run...");
        await main({
          ...baseOpts,
          fetch: incrementalFetch,
          since: baseOpts.since,
        });
      };

      if (intervalHours && intervalHours > 0) {
        const intervalMs = intervalHours * 60 * 60 * 1000;
        log(`Scheduling incremental runs every ${intervalHours} hour(s)`);
        await runIncremental();
        setInterval(runIncremental, intervalMs);
        return;
      }

      await runIncremental();
    });

  program
    .command("commit-staged")
    .description("Commit staged scrape data into the database with duplicate checks")
    .option("--file <path>", "path to a specific staged file")
    .option("--all", "commit all staged files in the staging directory")
    .action(async (cmdOpts) => {
      const files: string[] = [];
      if (cmdOpts.file) {
        files.push(cmdOpts.file);
      }
      if (cmdOpts.all || !files.length) {
        const stagedFiles = await listStageFiles();
        files.push(...stagedFiles);
      }
      if (!files.length) {
        log("No staged files found to commit.");
        return;
      }
      await commitStagedFiles(files);
    });
  program
    .command("migrate-backend")
    .description("Copy the scraped SQLite data into the backend service database")
    .option(
      "--mode <mode>",
      "append to or override backend data (append|override)",
      "append"
    )
    .option(
      "--backend-env <path>",
      "path to the backend .env file used to resolve the DATABASE_URL"
    )
    .option(
      "--backend-url <url>",
      "explicit backend database connection string (overrides env file)"
    )
    .action(async (cmdOpts) => {
      const normalizedMode =
        typeof cmdOpts.mode === "string" && cmdOpts.mode.toLowerCase() === "override"
          ? "override"
          : "append";
      await migrateAgentsDataToBackend({
        mode: normalizedMode,
        backendEnvPath: cmdOpts.backendEnv,
        backendDatabaseUrl: cmdOpts.backendUrl,
      });
    });

  program.parseAsync(process.argv).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

async function run(opts: CliOptions) {
  if (!opts.locale) throw new Error("You must specify a locale using --locale or -l");
  const locale = opts.ukWide ? "United Kingdom" : opts.locale;
  const llmBudget = createLlmBudget({
    noLlm: Boolean(opts.noLlm ?? envValues.NO_LLM),
    maxCalls: opts.llmBudget ?? envValues.LLM_BUDGET,
  });
  const existingTitleMap = await getExistingProjectTitleMap();
  const stagedTitleSet = await loadStagedTitleSet();
  const searchLocales = resolveSearchLocales(locale, Boolean(opts.ukWide));
  if (!searchLocales.length) throw new Error("No valid locale segments derived from input");

  log(
    "Searching for infrastructure projects in",
    opts.ukWide ? "United Kingdom (UK-wide)" : locale
  );
  log(llmBudget.summary());
  if (searchLocales.length > 1) {
    log("Derived search areas:", searchLocales.join(", "));
  }

  const minFetch = opts.fetch ?? opts.limit ?? 10;
  log(`Targeting at least ${minFetch} unique projects`);
  const connectorNames = resolveConnectorNames(opts.connectors);
  const sinceDate = opts.since ? new Date(opts.since) : null;
  const connectorProjects = connectorNames.length
    ? await fetchFromConnectors(connectorNames, sinceDate)
    : [];

  if (connectorNames.length) {
    log(
      `[Connectors] Loaded ${connectorProjects.length} project(s) from ${connectorNames.join(", ")}`
    );
  }

  const searchResults = opts.connectorsOnly
    ? { projects: [], summary: "connectors-only run" }
    : await collectProjectsAcrossLocales(searchLocales, minFetch, llmBudget, [
        ...existingTitleMap.keys(),
        ...stagedTitleSet,
      ]);
  log(`Found ${searchResults.projects.length} unique infrastructure projects`);

  const processedProjects: ProjectStatus[] = [];
  const combinedProjects = mergeConnectorProjects(connectorProjects, searchResults.projects);
  const dedupedProjects = combinedProjects.filter((project) => {
    const normalized = normalizeProjectTitle(project.title);
    if (!normalized) return true;
    return !existingTitleMap.has(normalized) && !stagedTitleSet.has(normalized);
  });
  const skippedCount = combinedProjects.length - dedupedProjects.length;
  if (skippedCount > 0) {
    log(`[Dedup] Skipped ${skippedCount} project(s) already in DB or staging.`);
  }

  const ukProjects = dedupedProjects.filter((project) => isLikelyUkProject(project));
  const nonUkCount = dedupedProjects.length - ukProjects.length;
  if (nonUkCount > 0) {
    log(`[Filter] Skipped ${nonUkCount} project(s) that did not appear UK-based.`);
  }
  const toProcess =
    opts.limit && opts.limit > 0
      ? ukProjects.slice(0, opts.limit)
      : ukProjects;
  const maxEvidencePerProject = opts.maxEvidence ?? 10;
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 3, 10));
  log(
    `Processing ${toProcess.length} projects (concurrency=${concurrency}, maxEvidence=${maxEvidencePerProject})`
  );

  const connectorEvidenceMap = buildConnectorEvidenceMap(connectorProjects);
  const queue = [...toProcess];
  async function worker(id: number) {
    while (queue.length) {
      const project = queue.shift();
      if (!project) break;
      log(`[W${id}] Gathering ${maxEvidencePerProject} evidence pieces for ${project.title}`);
      try {
        await processSingleProject(
          project,
          locale,
          maxEvidencePerProject,
          processedProjects,
          llmBudget,
          connectorEvidenceMap.get(normalizeProjectTitle(project.title)),
          !opts.stage
        );
      } catch (e: any) {
        log(`[W${id}] Error processing ${project.title}:`, e?.message || e);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));

  log(`\nCompleted processing ${processedProjects.length} infrastructure projects`);
  log("Search summary:", searchResults.summary);

  if (opts.stage) {
    const stageFile = await writeStageFile(
      processedProjects,
      opts.ukWide ? "UK-wide" : locale
    );
    log(`Staged ${processedProjects.length} project(s) to ${stageFile}`);
  }
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
  processedProjects: ProjectStatus[],
  llmBudget: ReturnType<typeof createLlmBudget>,
  seedEvidence?: ProjectFoundItem[],
  commitToDb: boolean = true
) {
  let evidenceItems: ProjectFoundItem[] = seedEvidence && seedEvidence.length ? seedEvidence : [];
  let evidenceResultsSummary = "";

  if (!evidenceItems.length) {
    const canGatherEvidence = llmBudget.consume("evidence gathering");
    const evidenceResults = await gatherEvidenceWithGemini(
      project.title,
      project.description,
      locale,
      maxEvidence,
      { forceMock: !canGatherEvidence }
    );
    evidenceResultsSummary = evidenceResults.summary;
    evidenceItems = evidenceResults.evidence.map((e) => ({
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
  }

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

  log(`Evaluating project status and location for: ${project.title}...`);
  const canEvaluate = llmBudget.consume("project evaluation");
  const provider = resolveProvider();
  const evaluationOptions =
    provider === "gemini"
      ? {
          apiKey: getGeminiApiKey(),
          model: envValues.GEMINI_MODEL || (process.env.MODEL ? envValues.MODEL : "gemini-2.5-flash"),
        }
      : {
          openAIApiKey: getOpenAIApiKey() || envValues.OPENAI_API_KEY,
          openAIModel: envValues.OPENAI_MODEL || (process.env.MODEL ? envValues.MODEL : "gpt-5-mini"),
        };

  const evaluation = await evaluateProjectWithRetry(
    {
      projectName: project.title,
      projectDescription: project.description,
      locale,
      evidence: evidenceItems.map((item) => ({
        title: item.title,
        summary: item.summary,
        source: item.source,
        sourceUrl: item.sourceUrl,
        evidenceDate: item.evidenceDate,
        rawText: item.rawText,
      })),
    },
    {
      ...evaluationOptions,
      mockResponse: envValues.MOCK_PROJECT_EVALUATION || !canEvaluate,
    },
    provider
  );

  projectStatus.status = evaluation.ragStatus;
  projectStatus.statusRationale = evaluation.ragRationale;
  projectStatus.latitude = evaluation.latitude;
  projectStatus.longitude = evaluation.longitude;
  projectStatus.locationDescription = evaluation.locationDescription;
  projectStatus.locationSource = evaluation.locationSource;
  projectStatus.locationConfidence = evaluation.locationConfidence;

  if (commitToDb) {
    await upsertProject(projectStatus);
  }
  processedProjects.push(projectStatus);
  log(
    `Project ${project.title} processed with status: ${projectStatus.status}${
      projectStatus.statusRationale ? ` (rationale: ${projectStatus.statusRationale})` : ""
    }`
  );
  if (projectStatus.latitude != null && projectStatus.longitude != null) {
    log(
      `Location resolved: ${projectStatus.latitude}, ${projectStatus.longitude}${
        projectStatus.locationDescription ? ` (${projectStatus.locationDescription})` : ""
      }`
    );
  }
  log(`Evidence gathered: ${evidenceItems.length} items`);
  if (evidenceResultsSummary) {
    log(`Evidence summary: ${evidenceResultsSummary}`);
  }
}
// end processSingleProject

async function commitStagedFiles(files: string[]) {
  const existingTitleMap = await getExistingProjectTitleMap();
  const seenTitles = new Set<string>();
  let committed = 0;
  let skipped = 0;

  for (const file of files) {
    const payload = await readStageFile(file);
    log(
      `Committing ${payload.projects.length} staged project(s) from ${file} (created ${payload.createdAt})`
    );

    for (const project of payload.projects) {
      const normalized = normalizeProjectTitle(project.name);
      if (normalized && seenTitles.has(normalized)) {
        skipped += 1;
        continue;
      }
      if (normalized) {
        const existingId = existingTitleMap.get(normalized);
        if (existingId) {
          project.id = existingId;
        } else {
          existingTitleMap.set(normalized, project.id);
        }
        seenTitles.add(normalized);
      }
      await upsertProject(project);
      committed += 1;
    }
  }

  log(`Committed ${committed} project(s). Skipped ${skipped} duplicate(s) in staging.`);
}

function mergeConnectorProjects(
  connectors: ConnectorProject[],
  discovered: InfrastructureProject[]
): InfrastructureProject[] {
  const merged: InfrastructureProject[] = [];
  const seen = new Set<string>();

  const add = (project: InfrastructureProject) => {
    const normalized = normalizeProjectTitle(project.title);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    merged.push(project);
  };

  connectors.forEach((project) => add(connectorToInfrastructure(project)));
  discovered.forEach((project) => add(project));

  return merged;
}

function connectorToInfrastructure(project: ConnectorProject): InfrastructureProject {
  return {
    title: project.title,
    description: project.description,
    status: project.status || "Planning",
    source: project.source,
    url: project.url,
    latitude: project.latitude,
    longitude: project.longitude,
    localAuthority: project.localAuthority,
    region: project.region,
  };
}

function buildConnectorEvidenceMap(projects: ConnectorProject[]) {
  const map = new Map<string, ProjectFoundItem[]>();
  for (const project of projects) {
    if (!project.evidence || !project.evidence.length) continue;
    const normalized = normalizeProjectTitle(project.title);
    if (!normalized) continue;
    map.set(normalized, project.evidence.map(toProjectFoundItem));
  }
  return map;
}

function toProjectFoundItem(evidence: ConnectorEvidence): ProjectFoundItem {
  return {
    timestamp: evidence.evidenceDate,
    sourceUrl: evidence.sourceUrl,
    summary: evidence.summary,
    sentiment: "Neutral",
    rawText: evidence.rawText ?? "",
    source: evidence.source,
    title: evidence.title,
    evidenceDate: evidence.evidenceDate,
    gatheredDate: evidence.evidenceDate,
    gatheredBy: "connector",
  };
}

async function evaluateProjectWithRetry(
  input: Parameters<typeof evaluateProjectWithGemini>[0],
  options: Parameters<typeof evaluateProjectWithGemini>[1],
  provider: LlmProvider
) {
  const mutableOptions = { ...options };
  while (true) {
    try {
      if (provider === "openai") {
        return await evaluateProjectWithOpenAI(input, mutableOptions);
      }
      return await evaluateProjectWithGemini(input, mutableOptions);
    } catch (err) {
      if (provider === "openai") {
        if (!isOpenAIRateLimitError(err)) {
          throw err;
        }
        const action = await handleOpenAIRateLimit("project evaluation");
        if (action === "abort") {
          throw err;
        }
        const nextKey = getOpenAIApiKey();
        if (!nextKey) {
          throw err;
        }
        mutableOptions.openAIApiKey = nextKey;
        continue;
      }

      if (!isGeminiRateLimitError(err)) {
        throw err;
      }
      const action = await handleGeminiRateLimit("project evaluation");
      if (action === "abort") {
        throw err;
      }
      const nextKey = getGeminiApiKey();
      if (!nextKey) {
        throw err;
      }
      mutableOptions.apiKey = nextKey;
    }
  }
}
