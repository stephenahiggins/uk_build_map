import 'dotenv/config';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import * as fs from 'fs';
import * as path from 'path';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';
import { seedProjectsArray } from './lib/seedProjectsArray';

resolveDatabaseUrlForHostScripts();

const prisma = createPrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: ts-node scripts/seedProjectsFromFile.ts <projects.seed.json>');
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  let projects: unknown[];
  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (!Array.isArray(parsed)) throw new Error('JSON root must be an array');
    projects = parsed;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    process.exit(1);
  }

  const { successCount, failCount } = await seedProjectsArray(prisma, projects);
  console.log(`\nSeeding complete. Success: ${successCount}, Failed: ${failCount}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
