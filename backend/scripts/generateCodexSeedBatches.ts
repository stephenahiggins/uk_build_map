import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { buildAuthorityCoverageSnapshot } from '../src/lib/authorityCoverage';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';

type AuthorityExport = {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  regionId: string;
  regionName: string | null;
};

type CoverageRow = {
  id: string;
  projectCount: number;
  staleProjectCount: number;
  mappingQuality: string;
  priority: string;
};

function parseArgs() {
  const argv = process.argv.slice(2);
  let authoritiesJson = '';
  let coverageJson = path.join(
    process.cwd(),
    'seeds',
    'authority-coverage.snapshot.json'
  );
  let outDir = path.join(process.cwd(), 'seeds', 'codex-batches');
  let batchSize = 18;
  let coverageFromDb = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === '--authorities-json' || arg === '-a') && argv[i + 1]) {
      authoritiesJson = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (arg === '--coverage-json' && argv[i + 1]) {
      coverageJson = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (arg === '--out-dir' && argv[i + 1]) {
      outDir = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (arg === '--batch-size' && argv[i + 1]) {
      batchSize = Math.max(1, Number.parseInt(argv[++i], 10) || 18);
      continue;
    }
    if (arg === '--coverage-from-db') {
      coverageFromDb = true;
      continue;
    }
  }

  if (!authoritiesJson) {
    throw new Error('Missing required --authorities-json path.');
  }

  return { authoritiesJson, coverageJson, outDir, batchSize, coverageFromDb };
}

function loadJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function countryPriority(countryCode: string): number {
  switch (countryCode) {
    case 'SCOTLAND':
      return 0;
    case 'WALES':
      return 1;
    case 'NORTHERN_IRELAND':
      return 2;
    default:
      return 3;
  }
}

function buildPrompt(
  batchNumber: number,
  authorities: AuthorityExport[]
): string {
  const table = authorities
    .map(
      (authority) =>
        `| ${authority.id} | ${authority.name.replace(/\|/g, '/')} | ${authority.code} | ${authority.regionName ?? ''} | ${authority.countryCode} |`
    )
    .join('\n');

  return `# Growth Map Codex Batch ${batchNumber}

You are working in the backend app root. Treat \`seeds/\` as the correct relative directory; do not prepend an extra \`backend/\`.

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
${table}

## Scope

- Find verifiable infrastructure, regeneration, transport, utilities, civic estate, or flood-resilience projects.
- Also look for obvious named sites and destination-led schemes inside each authority: heritage assets, landmarks, visitor attractions, waterfronts, stations, ports, town-centre gateways, major roads, hospitals, campuses, and world-heritage or nationally significant sites.
- Include projects led by councils, combined authorities, arm's-length bodies, National Highways, Network Rail, the Planning Inspectorate/DCO process, or central government where the project is physically located in the listed authority.
- Do not stop at generic council search terms. For each authority, explicitly try site-led searches such as "<authority> tunnel", "<authority> station redevelopment", "<authority> bypass", "<authority> town deal", "<authority> levelling up", "<authority> heritage restoration", "<authority> castle", "<authority> waterfront", "<authority> museum", "<authority> market hall", "<authority> world heritage", and "<authority> planning inspectorate".
- Prioritise projects that would be obvious to a local resident or reporter, including controversial or delayed schemes, not just live procurements.
- Prefer official local authority, combined authority, Planning Inspectorate, Contracts Finder, Find a Tender, or reputable local news sources.
- Prioritise projects with evidence from the last 24 months.
- Do not invent URLs or citations.

## Search Heuristics

- Start broad, then narrow to named sites. If an authority has a famous place, search the place name directly rather than relying only on the authority name.
- Prefer the most specific project title you can evidence, for example a named road scheme, station redevelopment, harbour programme, castle restoration, or tunnel proposal.
- Capture nationally significant projects that sit within a local authority boundary even if the sponsoring body is national rather than local.
- If multiple sources discuss the same obvious site, consolidate them into one project with stronger evidence instead of emitting several near-duplicates.
- Where a project is high-profile but stalled, litigated, or awaiting consent, keep it and set status/statusRationale accordingly.

## Output

Return only a JSON array in your final message. Do not write files. Each object should include:

- \`id\`
- \`title\`
- \`description\`
- \`type\`
- \`regionId\`
- \`localAuthorityId\`
- \`createdById\` = \`1\`
- \`status\`
- \`statusRationale\`
- \`latitude\`, \`longitude\`, \`locationDescription\`, \`locationSource\`, \`locationConfidence\` when supported by evidence
- \`evidence\`: array with \`type\`, \`title\`, \`source\`, \`url\`, \`datePublished\`, \`summary\`
`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function pickCoverageFields(row: {
  id: string;
  projectCount: number;
  staleProjectCount: number;
  mappingQuality: string;
  priority: string;
}): CoverageRow {
  return {
    id: row.id,
    projectCount: row.projectCount,
    staleProjectCount: row.staleProjectCount,
    mappingQuality: row.mappingQuality,
    priority: row.priority,
  };
}

async function loadCoverageRows(
  coverageJson: string,
  coverageFromDb: boolean
): Promise<CoverageRow[]> {
  if (!coverageFromDb && fs.existsSync(coverageJson)) {
    const payload = JSON.parse(fs.readFileSync(coverageJson, 'utf-8')) as {
      rows?: CoverageRow[];
    };
    const rows = payload.rows ?? [];
    if (rows.length > 0) {
      return rows.map(pickCoverageFields);
    }
  }

  if (coverageFromDb) {
    console.log('Using authority coverage from database (--coverage-from-db).');
  } else {
    console.log(
      `Coverage snapshot missing or empty (${coverageJson}); building ranking from database.`
    );
  }

  resolveDatabaseUrlForHostScripts();
  const prisma = createPrismaClient();
  try {
    const snapshot = await buildAuthorityCoverageSnapshot(prisma);
    return snapshot.rows.map(pickCoverageFields);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const { authoritiesJson, coverageJson, outDir, batchSize, coverageFromDb } =
    parseArgs();
  const authorities = loadJsonFile<AuthorityExport[]>(authoritiesJson, []);
  const coverageRows = await loadCoverageRows(coverageJson, coverageFromDb);
  const coverageById = new Map(coverageRows.map((row) => [row.id, row]));

  const rankedAuthorities = [...authorities].sort((left, right) => {
    const leftCoverage = coverageById.get(left.id);
    const rightCoverage = coverageById.get(right.id);

    const countryDelta =
      countryPriority(left.countryCode) - countryPriority(right.countryCode);
    if (countryDelta !== 0) return countryDelta;

    const leftProjects = leftCoverage?.projectCount ?? 0;
    const rightProjects = rightCoverage?.projectCount ?? 0;
    if (leftProjects !== rightProjects) return leftProjects - rightProjects;

    const leftStale = leftCoverage?.staleProjectCount ?? 0;
    const rightStale = rightCoverage?.staleProjectCount ?? 0;
    if (leftStale !== rightStale) return rightStale - leftStale;

    const leftMapping = leftCoverage?.mappingQuality ?? 'POOR';
    const rightMapping = rightCoverage?.mappingQuality ?? 'POOR';
    if (leftMapping !== rightMapping) {
      return leftMapping.localeCompare(rightMapping);
    }

    return left.name.localeCompare(right.name);
  });

  const batches = chunk(rankedAuthorities, batchSize);
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, 'out'), { recursive: true });

  batches.forEach((batch, index) => {
    const batchNumber = index + 1;
    const padded = String(batchNumber).padStart(3, '0');
    fs.writeFileSync(
      path.join(outDir, `batch-${padded}-authorities.json`),
      `${JSON.stringify(batch, null, 2)}\n`,
      'utf-8'
    );
    fs.writeFileSync(
      path.join(outDir, `batch-${padded}-PROMPT.md`),
      buildPrompt(batchNumber, batch),
      'utf-8'
    );
  });

  console.log(
    `Wrote ${batches.length} Codex batch(es) to ${outDir} (${rankedAuthorities.length} authorities).`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
