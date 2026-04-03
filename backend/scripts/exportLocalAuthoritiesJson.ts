/**
 * Export all LocalAuthority rows (with region name) for Claude/Codex batch seeding.
 *
 * Usage:
 *   npx ts-node scripts/exportLocalAuthoritiesJson.ts [outPath]
 *
 * Default outPath: seeds/local-authorities.json (relative to backend cwd).
 * Connection: DATABASE_URL, or BACKEND_DATABASE_URL when DATABASE_URL uses Docker host `db`.
 * Override with LOCAL_DATABASE_URL (e.g. mysql://root:pass@127.0.0.1:3307/dbname).
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';

resolveDatabaseUrlForHostScripts();

const prisma = createPrismaClient();

async function main() {
  const outArg = process.argv[2];
  const outPath = path.resolve(
    process.cwd(),
    outArg || 'seeds/local-authorities.json'
  );

  const authorities = await prisma.localAuthority.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      countryCode: true,
      regionId: true,
    },
  });

  const regionIds = Array.from(
    new Set(authorities.map((a) => a.regionId))
  );
  const regions = await prisma.region.findMany({
    where: { id: { in: regionIds } },
    select: { id: true, name: true },
  });
  const regionNameById = new Map(regions.map((r) => [r.id, r.name]));

  const payload = authorities.map((a) => ({
    id: a.id,
    name: a.name,
    code: a.code,
    countryCode: a.countryCode,
    regionId: a.regionId,
    regionName: regionNameById.get(a.regionId) ?? null,
  }));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  console.log(`Wrote ${payload.length} local authorities to ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
