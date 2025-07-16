import { PrismaClient, EvidenceType, ProjectStatus, ProjectType } from '@prisma/client';
import { EvidenceRecord } from './types';

const prisma = new PrismaClient();

/**
 * Save evidence to the backend database. If a matching project does not exist
 * a new project record is created. Evidence is deduplicated by title.
 */
export async function saveEvidence(record: EvidenceRecord): Promise<void> {
  // Look up project by title
  let project = await prisma.project.findFirst({ where: { title: record.title } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        title: record.title,
        description: record.summary,
        type: ProjectType.LOCAL_GOV,
        status: ProjectStatus.AMBER,
        createdById: 1, // system user
      },
    });
  }

  // Skip if evidence already exists
  const existing = await prisma.evidenceItem.findFirst({
    where: { projectId: project.id, title: record.title },
  });
  if (existing) return;

  await prisma.evidenceItem.create({
    data: {
      projectId: project.id,
      submittedById: 1,
      type: EvidenceType.TEXT,
      title: record.title,
      summary: record.summary,
      source: record.source,
      description: record.content,
    },
  });
}

/** Fetch all projects with their evidence */
export async function getProjectsWithEvidence() {
  return prisma.project.findMany({ include: { evidence: true } });
}
