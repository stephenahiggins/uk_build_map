import { Command } from "commander";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import {
  applyRuntimeOverrides,
  envValues,
  resolveProvider,
  type LlmProvider,
  validateEnvValues,
} from "./envValues";
import {
  evaluateProjectDeterministically,
  type ProjectEvaluationRequest,
} from "../../backend/src/lib/projectEvaluation";
import { log } from "./logger";

type RagOptions = {
  limit?: number;
  projectIds?: string[];
  provider?: string;
  geminiModel?: string;
  dryRun?: boolean;
};

function parseRagOptions(raw: Record<string, any>): RagOptions {
  const parsed: RagOptions = {};
  if (raw.limit !== undefined) parsed.limit = parseInt(raw.limit, 10);
  if (raw.projectId) {
    parsed.projectIds = Array.isArray(raw.projectId) ? raw.projectId : [raw.projectId];
  }
  if (raw.provider !== undefined) parsed.provider = String(raw.provider);
  if (raw.geminiModel !== undefined) parsed.geminiModel = String(raw.geminiModel);
  if (raw.dryRun !== undefined) parsed.dryRun = Boolean(raw.dryRun);
  return parsed;
}

async function evaluateProject(
  prisma: PrismaClient,
  project: any,
  provider: LlmProvider
) {
  const evidence = project.evidence.map((item: any) => ({
    title: item.title || undefined,
    summary: item.summary || undefined,
    source: item.source || undefined,
    sourceUrl: item.url || undefined,
    evidenceDate: item.datePublished ? item.datePublished.toISOString() : undefined,
    rawText: item.description || undefined,
  }));

  const locale =
    project.localAuthority?.name ||
    project.region?.name ||
    envValues.LOCALE ||
    undefined;

  const request: ProjectEvaluationRequest = {
    projectName: project.title || "(unknown)",
    projectDescription: project.description || undefined,
    locale,
    evidence,
  };

  return evaluateProjectDeterministically(request, {
    mockResponse: envValues.MOCK_PROJECT_EVALUATION,
  });
}

async function runRagAgent(options: RagOptions) {
  if (options.provider) {
    applyRuntimeOverrides({ PROVIDER: resolveProvider(options.provider) });
  }
  if (options.geminiModel) {
    applyRuntimeOverrides({ GEMINI_MODEL: options.geminiModel });
  }
  if (resolveProvider() === "gemini") {
    validateEnvValues();
  }

  const prisma = new PrismaClient();
  try {
    const where: Record<string, any> = {};
    if (options.projectIds && options.projectIds.length > 0) {
      where.id = { in: options.projectIds };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        evidence: { orderBy: { datePublished: "desc" } },
        region: true,
        localAuthority: true,
      },
      orderBy: { statusUpdatedAt: "desc" },
      ...(options.limit ? { take: options.limit } : {}),
    });

    if (projects.length === 0) {
      log("[RAG] No projects found to evaluate.");
      return;
    }

    const provider = resolveProvider();
    log(`[RAG] Re-evaluating ${projects.length} project(s) using ${provider}...`);

    for (const project of projects) {
      try {
        log(`[RAG] Evaluating ${project.title} (${project.id})...`);
        const evaluation = await evaluateProject(prisma, project, provider);
        const status = evaluation.ragStatus.toUpperCase() as "RED" | "AMBER" | "GREEN";

        if (options.dryRun) {
          log(
            `[RAG] Dry run: ${project.title} -> ${status} (${evaluation.ragRationale})`
          );
          continue;
        }

        await prisma.project.update({
          where: { id: project.id },
          data: {
            status,
            statusRationale: evaluation.ragRationale,
            statusUpdatedAt: new Date(),
            latitude: evaluation.latitude,
            longitude: evaluation.longitude,
            locationDescription: evaluation.locationDescription ?? null,
            locationSource: evaluation.locationSource ?? null,
            locationConfidence: evaluation.locationConfidence ?? null,
          },
        });

        log(`[RAG] Updated ${project.title} -> ${status}`);
      } catch (error) {
        log(`[RAG] Failed to evaluate ${project.title}:`, error);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  const program = new Command();
  program
    .name("rag-agent")
    .description("Re-evaluate RAG status for projects using the configured LLM");

  program
    .option("-n, --limit <number>", "limit number of projects to evaluate")
    .option(
      "--project-id <id>",
      "only evaluate a specific project id (repeatable)",
      (value, previous: string[]) => previous.concat([value]),
      []
    )
    .option(
      "--provider <provider>",
      "LLM provider to use (gemini only for live inference); deterministic scoring remains the default evaluation path"
    )
    .option("--gemini-model <model>", "override Gemini model (GEMINI_MODEL)")
    .option("--dry-run", "log updates without writing to the database");

  program.parse(process.argv);
  const options = parseRagOptions(program.opts());

  runRagAgent(options).catch((error) => {
    log("[RAG] Fatal error:", error);
    process.exitCode = 1;
  });
}
