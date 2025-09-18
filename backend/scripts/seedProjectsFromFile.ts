import { createPrismaClient } from '../src/lib/createPrismaClient';
import * as fs from 'fs';
import * as path from 'path';

const prisma = createPrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      'Usage: ts-node scripts/seedProjectsFromFile.ts <projects.seed.json>'
    );
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  let projects;
  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    projects = JSON.parse(fileContent);
    if (!Array.isArray(projects)) throw new Error('JSON root must be an array');
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const project of projects) {
    try {
      // Ensure createdById is set to 1 if not provided
      // Remove createdBy property if present
      const { createdBy, evidence, ...rest } = project;
      const projectData = {
        ...rest,
        createdById: project.createdById ?? 1,
      };
      // don't include 'evidence' in projectData

      // Adjust the fields below to match your Prisma schema
      const seededProject = await prisma.project.upsert({
        where: { id: project.id },
        update: {},
        create: projectData,
      });

      // Seed evidence items if present
      if (Array.isArray(project.evidence) && project.evidence.length > 0) {
        type EvidenceSeed = {
          type: string;
          title: string;
          summary?: string;
          source?: string;
          url?: string;
          datePublished?: string;
        };
        const evidenceItems = project.evidence.map(
          (evidence: EvidenceSeed) => ({
            projectId: seededProject.id,
            submittedById: 1, // Default admin user
            type: evidence.type,
            title: evidence.title,
            summary: evidence.summary,
            source: evidence.source,
            url: evidence.url,
            datePublished: evidence.datePublished
              ? new Date(evidence.datePublished)
              : undefined,
          })
        );
        await prisma.evidenceItem.createMany({
          data: evidenceItems,
          skipDuplicates: true,
        });
        console.log(
          `  Seeded ${evidenceItems.length} evidence items for project: ${project.title || project.id}`
        );
      }
      console.log(`Seeded: ${project.title || project.id}`);
      successCount++;
    } catch (e) {
      console.error(`Failed to seed project ${project.id}:`, e);
      failCount++;
    }
  }
  console.log(
    `\nSeeding complete. Success: ${successCount}, Failed: ${failCount}`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
