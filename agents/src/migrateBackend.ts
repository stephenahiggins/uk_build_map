import { PrismaClient as AgentsPrismaClient } from "@prisma/client";
import type {
  PrismaClient as BackendPrismaClientType,
  EvidenceItem as BackendEvidenceItem,
  Project as BackendProject,
  User as BackendUser,
} from "../../backend/node_modules/@prisma/client";
import crypto from "node:crypto";
import fs from "fs";
import path from "path";
import { parse as parseDotenv } from "dotenv";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { envValues } from "./envValues";
import { log } from "./logger";
import { normalizeProjectTitle } from "./utils/projectNormalization";

type MigrateMode = "override" | "append";

type MigrateOptions = {
  mode: MigrateMode;
  backendEnvPath?: string;
  backendDatabaseUrl?: string;
};

type MigrationResult = {
  createdProjects: number;
  updatedProjects: number;
  createdEvidence: number;
};

const require = createRequire(import.meta.url);
const backendClientModule = require("../../backend/node_modules/@prisma/client") as typeof import("../../backend/node_modules/@prisma/client");
const BackendPrismaClient = backendClientModule.PrismaClient;

type AgentsPrisma = AgentsPrismaClient;
type AgentsProject = Awaited<ReturnType<AgentsPrisma["project"]["findMany"]>>[number];
type AgentsEvidence = Awaited<ReturnType<AgentsPrisma["evidenceItem"]["findMany"]>>[number];

type AgentsProjectWithEvidence = AgentsProject & { evidence: AgentsEvidence[] };

type BackendPrisma = BackendPrismaClientType;

type BackendProjectSummary = Pick<BackendProject, "id" | "title">;

type EvidenceKeySource = Pick<AgentsEvidence, "id" | "url" | "source" | "title" | "summary">;

type BackendEvidenceKeySource = Pick<BackendEvidenceItem, "id" | "url" | "source" | "title" | "summary">;

export async function migrateAgentsDataToBackend(options: MigrateOptions): Promise<MigrationResult> {
  const agentsDatabaseUrl = envValues.DATABASE_URL;
  if (!agentsDatabaseUrl) {
    throw new Error("Agents DATABASE_URL environment variable is not configured");
  }

  const backendDatabaseUrl = resolveBackendDatabaseUrl(options);
  if (!backendDatabaseUrl) {
    throw new Error(
      "Unable to determine backend DATABASE_URL. Provide --backend-url, set BACKEND_DATABASE_URL, or create backend/.env."
    );
  }

  log(`[Migrate] Using backend database ${redactConnectionString(backendDatabaseUrl)}`);

  const agentsPrisma = new AgentsPrismaClient({
    datasources: { db: { url: agentsDatabaseUrl } },
  });
  const backendPrisma = new BackendPrismaClient({
    datasources: { db: { url: backendDatabaseUrl } },
  }) as BackendPrisma;

  try {
    const adminUser = await ensureBackendAdminUser(backendPrisma);

    const projects = await agentsPrisma.project.findMany({
      include: { evidence: true },
    });

    log(`[Migrate] Found ${projects.length} project(s) in the agents datastore`);

    if (options.mode === "override") {
      await clearBackendProjects(backendPrisma);
    }

    const existingMaps =
      options.mode === "append" ? await loadExistingProjectMaps(backendPrisma) : undefined;

    let createdProjects = 0;
    let updatedProjects = 0;
    let createdEvidence = 0;

    for (const project of projects) {
      const normalizedTitle = normalizeProjectTitle(project.title);
      const { createData, updateData } = buildBackendProjectData(project, adminUser.user_id);

      if (options.mode === "append" && existingMaps) {
        const existingById = existingMaps.byId.get(project.id);
        const existingByTitle = existingMaps.byTitle.get(normalizedTitle);
        const existing = existingById ?? existingByTitle;
        if (existing) {
          await backendPrisma.project.update({
            where: { id: existing.id },
            data: updateData,
          });
          existingMaps.byId.set(existing.id, { id: existing.id, title: updateData.title });
          const updatedNormalized = normalizeProjectTitle(updateData.title);
          for (const [key, value] of existingMaps.byTitle.entries()) {
            if (value.id === existing.id && key !== updatedNormalized) {
              existingMaps.byTitle.delete(key);
            }
          }
          if (updatedNormalized) {
            existingMaps.byTitle.set(updatedNormalized, { id: existing.id, title: updateData.title });
          }
          const evidenceAdded = await syncEvidenceForProject(
            backendPrisma,
            existing.id,
            project.evidence,
            adminUser.user_id
          );
          createdEvidence += evidenceAdded;
          updatedProjects += 1;
          continue;
        }
      }

      await backendPrisma.project.create({
        data: {
          ...createData,
          evidence: {
            create: project.evidence.map((item) => mapEvidenceForNestedCreate(item, adminUser.user_id)),
          },
        },
      });
      if (existingMaps) {
        const summary = { id: createData.id, title: createData.title };
        existingMaps.byId.set(createData.id, summary);
        const normalizedCreated = normalizeProjectTitle(createData.title);
        if (normalizedCreated) {
          existingMaps.byTitle.set(normalizedCreated, summary);
        }
      }

      createdProjects += 1;
      createdEvidence += project.evidence.length;
    }

    log(
      `[Migrate] Created ${createdProjects} project(s), updated ${updatedProjects} project(s), added ${createdEvidence} evidence item(s)`
    );

    return { createdProjects, updatedProjects, createdEvidence };
  } finally {
    await Promise.allSettled([agentsPrisma.$disconnect(), backendPrisma.$disconnect()]);
  }
}

function resolveBackendDatabaseUrl(options: MigrateOptions): string | undefined {
  if (options.backendDatabaseUrl) {
    return options.backendDatabaseUrl;
  }

  if (process.env.BACKEND_DATABASE_URL) {
    return process.env.BACKEND_DATABASE_URL;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const defaultEnvPath = path.resolve(__dirname, "..", "..", "backend", ".env");
  const candidatePaths = [options.backendEnvPath, defaultEnvPath].filter(
    (value): value is string => Boolean(value)
  );

  for (const candidate of candidatePaths) {
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(resolved)) {
      continue;
    }
    try {
      const parsed = parseDotenv(fs.readFileSync(resolved));
      if (parsed.BACKEND_DATABASE_URL) {
        return parsed.BACKEND_DATABASE_URL;
      }
      if (parsed.DATABASE_URL && parsed.DATABASE_URL !== envValues.DATABASE_URL) {
        return parsed.DATABASE_URL;
      }
    } catch (error) {
      log(`[Migrate] Failed to read backend env file at ${resolved}:`, error);
    }
  }

  return undefined;
}

async function ensureBackendAdminUser(prisma: BackendPrisma): Promise<BackendUser> {
  const plainPassword = "admin-default-password";
  const hashedPassword = crypto.createHash("sha256").update(plainPassword).digest("hex");

  return prisma.user.upsert({
    where: { user_email: "admin@example.com" },
    update: {},
    create: {
      user_name: "ADMIN",
      user_email: "admin@example.com",
      user_password: hashedPassword,
      type: "ADMIN",
    },
  });
}

async function clearBackendProjects(prisma: BackendPrisma) {
  log("[Migrate] Overriding backend data – clearing existing projects and evidence");
  await prisma.$transaction([
    prisma.evidenceItem.deleteMany({}),
    prisma.keyResult.deleteMany({}),
    prisma.objective.deleteMany({}),
    prisma.lLMSummary.deleteMany({}),
    prisma.discoveredProject.deleteMany({}),
    prisma.project.deleteMany({}),
  ]);
}

async function loadExistingProjectMaps(prisma: BackendPrisma) {
  const projects = await prisma.project.findMany({
    select: { id: true, title: true },
  });
  const byId = new Map<string, BackendProjectSummary>();
  const byTitle = new Map<string, BackendProjectSummary>();
  for (const project of projects) {
    const summary: BackendProjectSummary = { id: project.id, title: project.title };
    byId.set(project.id, summary);
    const normalized = normalizeProjectTitle(project.title);
    if (normalized) {
      byTitle.set(normalized, summary);
    }
  }
  return { byId, byTitle };
}

function buildBackendProjectData(project: AgentsProjectWithEvidence, adminUserId: number) {
  const base = {
    title: project.title,
    description: project.description ?? null,
    type: project.type,
    regionId: project.regionId,
    localAuthorityId: project.localAuthorityId,
    createdById: adminUserId,
    expectedCompletion: project.expectedCompletion,
    status: project.status,
    statusUpdatedAt: project.statusUpdatedAt ?? new Date(),
    statusRationale: project.statusRationale ?? null,
    latitude: project.latitude != null ? project.latitude.toString() : null,
    longitude: project.longitude != null ? project.longitude.toString() : null,
    imageUrl: project.imageUrl ?? null,
    moderationState: "APPROVED",
  };

  const createData = {
    id: project.id,
    ...base,
    createdAt: project.createdAt,
  } satisfies Parameters<BackendPrisma["project"]["create"]>[0]["data"];

  const updateData = {
    ...base,
  } satisfies Parameters<BackendPrisma["project"]["update"]>[0]["data"];

  return { createData, updateData };
}

function mapEvidenceForNestedCreate(evidence: AgentsEvidence, submittedById: number) {
  return {
    id: evidence.id,
    submittedById,
    type: evidence.type,
    title: evidence.title || evidence.summary?.substring(0, 80) || "Untitled Evidence",
    summary: evidence.summary ?? null,
    source: evidence.source ?? evidence.url ?? null,
    url: evidence.url ?? null,
    datePublished: evidence.datePublished ?? null,
    description: evidence.description ?? evidence.summary ?? null,
    moderationState: "APPROVED",
  } satisfies Parameters<BackendPrisma["project"]["create"]>[0]["data"]["evidence"]["create"][number];
}

function mapEvidenceForCreateMany(
  evidence: AgentsEvidence,
  submittedById: number,
  projectId: string
): Parameters<BackendPrisma["evidenceItem"]["createMany"]>[0]["data"][number] {
  return {
    id: evidence.id,
    projectId,
    submittedById,
    type: evidence.type,
    title: evidence.title || evidence.summary?.substring(0, 80) || "Untitled Evidence",
    summary: evidence.summary ?? null,
    source: evidence.source ?? evidence.url ?? null,
    url: evidence.url ?? null,
    datePublished: evidence.datePublished ?? null,
    description: evidence.description ?? evidence.summary ?? null,
    moderationState: "APPROVED",
  };
}

async function syncEvidenceForProject(
  prisma: BackendPrisma,
  projectId: string,
  evidenceItems: AgentsEvidence[],
  submittedById: number
) {
  if (!evidenceItems.length) {
    return 0;
  }

  const existing = await prisma.evidenceItem.findMany({
    where: { projectId },
    select: { id: true, url: true, source: true, title: true, summary: true },
  });
  const seen = new Set<string>();
  for (const item of existing) {
    seen.add(buildEvidenceKeyFromBackend(item));
  }

  const toCreate: Parameters<BackendPrisma["evidenceItem"]["createMany"]>[0]["data"] = [];
  for (const evidence of evidenceItems) {
    const key = buildEvidenceKey(evidence);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    toCreate.push(mapEvidenceForCreateMany(evidence, submittedById, projectId));
  }

  if (!toCreate.length) {
    return 0;
  }

  await prisma.evidenceItem.createMany({
    data: toCreate,
    skipDuplicates: true,
  });

  return toCreate.length;
}

function buildEvidenceKey(source: EvidenceKeySource): string {
  const parts = [source.url, source.source, source.title, source.summary]
    .map((value) => (value ? value.toLowerCase().replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean);
  return parts.join("|") || source.id;
}

function buildEvidenceKeyFromBackend(source: BackendEvidenceKeySource): string {
  const parts = [source.url, source.source, source.title, source.summary]
    .map((value) => (value ? value.toLowerCase().replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean);
  return parts.join("|") || source.id;
}

function redactConnectionString(connection: string): string {
  try {
    const url = new URL(connection);
    if (url.password) {
      url.password = "***";
    }
    return url.toString();
  } catch {
    return connection;
  }
}
