import { ProjectStatus } from '@prisma/client';
import { evaluateRag } from './llm';
import { getProjectsWithEvidence } from './db';

/**
 * Evaluate all projects in the database and assign a RAG status
 * based on their evidence summaries.
 */
export async function scoreProjects(): Promise<void> {
  const projects = await getProjectsWithEvidence();
  for (const project of projects) {
    const evidenceText = project.evidence.map((e) => e.summary || e.description || '').join('\n');
    if (!evidenceText) continue;
    const rag = await evaluateRag(evidenceText);
    await projectUpdate(project.id, rag);
  }
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function projectUpdate(id: string, rag: 'RED' | 'AMBER' | 'GREEN') {
  await prisma.project.update({
    where: { id },
    data: { status: rag as ProjectStatus, statusUpdatedAt: new Date() },
  });
}
