/**
 * Split local authorities into batches and emit markdown prompts + JSON slices
 * for manual use in Claude Code / Codex (capped subscription workflow).
 *
 * Usage:
 *   npx ts-node scripts/generateClaudeSeedBatches.ts --authorities-json seeds/local-authorities.json [--out-dir seeds/claude-batches] [--batch-size 22] [--focus all|nations]
 */
import * as fs from 'fs';
import * as path from 'path';

export type AuthorityExport = {
  id: string;
  name: string;
  code: string;
  countryCode: string;
  regionId: string;
  regionName: string | null;
};

function parseArgs() {
  const argv = process.argv.slice(2);
  let authoritiesJson = '';
  let outDir = path.join(process.cwd(), 'seeds', 'claude-batches');
  let batchSize = 22;
  let focus: 'all' | 'nations' = 'all';

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`
Usage: ts-node scripts/generateClaudeSeedBatches.ts --authorities-json <path> [options]

Options:
  --authorities-json <path>   JSON array from exportLocalAuthoritiesJson (required)
  --out-dir <path>            Output directory (default: seeds/claude-batches)
  --batch-size <n>            Authorities per batch (default: 22)
  --focus all|nations          nations = Scotland, Wales, Northern Ireland only
`);
      process.exit(0);
    }
    if (a === '--authorities-json' && argv[i + 1]) {
      authoritiesJson = argv[++i];
      continue;
    }
    if (a === '--out-dir' && argv[i + 1]) {
      outDir = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (a === '--batch-size' && argv[i + 1]) {
      batchSize = Math.max(1, parseInt(argv[++i], 10) || 22);
      continue;
    }
    if (a === '--focus' && argv[i + 1]) {
      const v = argv[++i].toLowerCase();
      if (v === 'nations' || v === 'all') focus = v;
      continue;
    }
  }

  if (!authoritiesJson) {
    console.error('Missing --authorities-json');
    process.exit(1);
  }

  return {
    authoritiesJson: path.resolve(process.cwd(), authoritiesJson),
    outDir,
    batchSize,
    focus,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function buildPromptMarkdown(
  batchIndex: number,
  authorities: AuthorityExport[]
): string {
  const table = authorities
    .map(
      (a) =>
        `| ${a.id} | ${a.name.replace(/\|/g, '/')} | ${a.code} | ${a.regionName ?? ''} | ${a.countryCode} |`
    )
    .join('\n');

  return `# Growth MAP — seed batch ${batchIndex}

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact \`localAuthorityId\` and \`regionId\` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
${table}

## Output format

Return **only** a JSON **array** (no markdown fences, no commentary). Each element must be one project object suitable for \`scripts/seedProjectsFromFile.ts\`:

- \`id\`: unique string (e.g. slug or UUID).
- \`title\`, \`description\`, \`type\`: usually \`LOCAL_GOV\` for council schemes (or \`REGIONAL_GOV\` / \`NATIONAL_GOV\` if truly regional/national).
- \`regionId\`, \`localAuthorityId\`: **must** match one of the rows above for the authority the project belongs to.
- \`createdById\`: \`1\`.
- \`status\`: \`GREEN\`, \`AMBER\`, or \`RED\` from cited reporting.
- \`statusRationale\`: short, grounded in evidence.
- \`latitude\`, \`longitude\`, \`locationDescription\`, \`locationSource\`, \`locationConfidence\` when you can cite a site.
- \`evidence\`: array of objects with \`type\` (\`URL\` for links), \`title\`, \`source\`, \`url\` (real http(s) only), \`datePublished\` (ISO date), \`summary\`.

## Rules

1. **Do not invent URLs.** Every \`url\` must be a real page you could open.
2. If you cannot find solid projects for an authority, **omit** that authority rather than guessing.
3. Prefer official \`.gov.uk\` council sources, combined authorities, or reputable national/local press.
4. **Save** your JSON array to \`backend/seeds/claude-batches/out/batch-${String(batchIndex).padStart(3, '0')}.json\` (create the \`out\` folder if needed).
`;
}

function main() {
  const { authoritiesJson, outDir, batchSize, focus } = parseArgs();
  const raw = fs.readFileSync(authoritiesJson, 'utf-8');
  let list = JSON.parse(raw) as AuthorityExport[];
  if (!Array.isArray(list)) {
    throw new Error('authorities JSON must be an array');
  }

  if (focus === 'nations') {
    list = list.filter((a) =>
      ['SCOTLAND', 'WALES', 'NORTHERN_IRELAND'].includes(a.countryCode)
    );
  }

  const batches = chunk(list, batchSize);
  fs.mkdirSync(outDir, { recursive: true });
  const outSub = path.join(outDir, 'out');
  fs.mkdirSync(outSub, { recursive: true });

  batches.forEach((batch, idx) => {
    const n = idx + 1;
    const pad = String(n).padStart(3, '0');
    const authPath = path.join(outDir, `batch-${pad}-authorities.json`);
    const promptPath = path.join(outDir, `batch-${pad}-PROMPT.md`);
    fs.writeFileSync(authPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf-8');
    fs.writeFileSync(promptPath, buildPromptMarkdown(n, batch), 'utf-8');
  });

  console.log(
    `Wrote ${batches.length} batch(es) under ${outDir} (${list.length} authorities, batch size ${batchSize}, focus=${focus})`
  );
  console.log(
    'Next: open each batch-*-PROMPT.md in Claude Code/Codex, then save JSON outputs to claude-batches/out/batch-NNN.json'
  );
}

main();
