import * as fs from 'fs';
import * as path from 'path';

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
  let coverageJson = path.join(process.cwd(), 'seeds', 'authority-coverage.snapshot.json');
  let outDir = path.join(process.cwd(), 'seeds', 'codex-batches');
  let batchSize = 18;

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
  }

  if (!authoritiesJson) {
    throw new Error('Missing required --authorities-json path.');
  }

  return { authoritiesJson, coverageJson, outDir, batchSize };
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

function buildPrompt(batchNumber: number, authorities: AuthorityExport[]): string {
  const table = authorities
    .map(
      (authority) =>
        `| ${authority.id} | ${authority.name.replace(/\|/g, '/')} | ${authority.code} | ${authority.regionName ?? ''} | ${authority.countryCode} |`
    )
    .join('\n');

  return `# Growth Map Codex Batch ${batchNumber}

Research under-covered local authorities using deterministic, public-source evidence only.

## Authority List

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
${table}

## Scope

- Find verifiable infrastructure, regeneration, transport, utilities, civic estate, or flood-resilience projects.
- Prefer official local authority, combined authority, Planning Inspectorate, Contracts Finder, Find a Tender, or reputable local news sources.
- Prioritise projects with evidence from the last 24 months.
- Do not invent URLs or citations.

## Output

Return only a JSON array. Each object should include:

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

Save the JSON array to \`backend/seeds/codex-batches/out/batch-${String(batchNumber).padStart(3, '0')}.json\`.
`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function main() {
  const { authoritiesJson, coverageJson, outDir, batchSize } = parseArgs();
  const authorities = loadJsonFile<AuthorityExport[]>(authoritiesJson, []);
  const coveragePayload = loadJsonFile<{ rows?: CoverageRow[] }>(coverageJson, {});
  const coverageById = new Map((coveragePayload.rows || []).map((row) => [row.id, row]));

  const rankedAuthorities = [...authorities].sort((left, right) => {
    const leftCoverage = coverageById.get(left.id);
    const rightCoverage = coverageById.get(right.id);

    const countryDelta = countryPriority(left.countryCode) - countryPriority(right.countryCode);
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

main();
