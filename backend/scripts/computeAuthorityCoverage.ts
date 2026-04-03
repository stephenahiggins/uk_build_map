import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { buildAuthorityCoverageSnapshot } from '../src/lib/authorityCoverage';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';

resolveDatabaseUrlForHostScripts();

const prisma = createPrismaClient();

async function main() {
  const outArg = process.argv[2];
  const outPath = path.resolve(
    process.cwd(),
    outArg || 'seeds/authority-coverage.snapshot.json'
  );

  const snapshot = await buildAuthorityCoverageSnapshot(prisma);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');
  console.log(`Wrote authority coverage snapshot to ${outPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
