import { PrismaClient } from "@prisma/client";
import { ProjectStatus } from "./types/projectEvidence";
import { v4 as uuidv4 } from "uuid";
import { PROJECT_TYPE, EVIDENCE_TYPE } from "./constants";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// Create or fetch an ADMIN user using provided credentials pattern
async function getOrCreateAdminUser() {
  const plainPassword = "admin-default-password"; // TODO: move to env var / secrets manager
  const hashedPassword = crypto.createHash("sha256").update(plainPassword).digest("hex");

  const adminUser = await prisma.user.upsert({
    where: { user_email: "admin@example.com" },
    update: {},
    create: {
      user_name: "ADMIN",
      user_email: "admin@example.com",
      user_password: hashedPassword,
      type: "ADMIN",
    },
  });
  return adminUser;
}

export async function upsertProject(project: ProjectStatus) {
  const adminUser = await getOrCreateAdminUser();

  const projectId = project.id || uuidv4();
  const status = project.status === "Red" ? "RED" : project.status === "Green" ? "GREEN" : "AMBER";
  const latitude =
    project.latitude === undefined || project.latitude === null ? null : Number(project.latitude);
  const longitude =
    project.longitude === undefined || project.longitude === null ? null : Number(project.longitude);

  // Attempt to find existing project
  const existing = await prisma.project.findUnique({ where: { id: projectId } });

  let persistedProject;
  if (existing) {
    persistedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: project.name,
        description: project.description,
        status,
        statusRationale: project.statusRationale,
        latitude,
        longitude,
        statusUpdatedAt: new Date(),
      },
    });
  } else {
    persistedProject = await prisma.project.create({
      data: {
        id: projectId,
        title: project.name,
        description: project.description,
        type: PROJECT_TYPE.LOCAL_GOV,
        status,
        createdById: adminUser.user_id,
        statusRationale: project.statusRationale,
        latitude,
        longitude,
      },
    });
  }

  // Deduplicate & insert evidence
  for (const evidence of project.evidence) {
    const existingEvidence = await prisma.evidenceItem.findFirst({
      where: {
        projectId: persistedProject.id,
        OR: [
          evidence.sourceUrl ? { url: evidence.sourceUrl } : undefined,
          evidence.sourceUrl ? { source: evidence.sourceUrl } : undefined,
          evidence.title ? { title: evidence.title } : undefined,
          evidence.summary ? { summary: evidence.summary } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (existingEvidence) continue;

    await prisma.evidenceItem.create({
      data: {
        id: uuidv4(),
        projectId: persistedProject.id,
        submittedById: adminUser.user_id,
        type: EVIDENCE_TYPE.TEXT,
        title: evidence.title || evidence.summary?.substring(0, 80) || "Untitled Evidence",
        summary: evidence.summary,
        source: evidence.source || evidence.sourceUrl || undefined,
        url: evidence.sourceUrl || undefined,
        datePublished: evidence.evidenceDate ? new Date(evidence.evidenceDate) : undefined,
        description: evidence.rawText,
      },
    });
  }

  return persistedProject;
}
