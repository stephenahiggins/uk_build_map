/**
 * Merge JSON array files from claude-batches/out into one seed file.
 *
 * Usage:
 *   npx ts-node scripts/mergeClaudeSeedOutputs.ts [--glob "seeds/claude-batches/out/*.json"] [--output seeds/merged-from-claude.json] [--check-urls]
 */
import * as fs from 'fs';
import * as path from 'path';

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function urlOk(url: string): Promise<boolean> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      signal: ac.signal,
      redirect: 'follow',
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        signal: ac.signal,
        redirect: 'follow',
        headers: { Range: 'bytes=0-0' },
      });
    }
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let globPattern = path.join(
    process.cwd(),
    'seeds',
    'claude-batches',
    'out',
    '*.json'
  );
  let output = path.join(process.cwd(), 'seeds', 'merged-from-claude.json');
  let checkUrls = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`
Usage: ts-node scripts/mergeClaudeSeedOutputs.ts [options]

Options:
  --glob <pattern>     Glob of batch JSON files (default: seeds/claude-batches/out/*.json)
  --output <path>      Merged output file (default: seeds/merged-from-claude.json)
  --check-urls         Drop evidence rows whose URL fails HTTP HEAD/GET
`);
      process.exit(0);
    }
    if (a === '--glob' && argv[i + 1]) {
      globPattern = argv[++i];
      continue;
    }
    if (a === '--output' && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (a === '--check-urls') {
      checkUrls = true;
    }
  }

  return { globPattern, output, checkUrls };
}

function expandGlob(pattern: string): string[] {
  const dir = path.dirname(pattern);
  const base = path.basename(pattern);
  if (!base.includes('*')) {
    return fs.existsSync(pattern) ? [pattern] : [];
  }
  const prefix = base.split('*')[0];
  const suffix = base.split('*').pop() ?? '';
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(suffix))
    .map((f) => path.join(dir, f))
    .sort();
}

async function filterEvidenceUrls(project: any, checkUrls: boolean) {
  if (!checkUrls || !Array.isArray(project.evidence)) return project;
  const next = [];
  for (const ev of project.evidence) {
    const u = ev?.url;
    if (typeof u === 'string' && /^https?:\/\//i.test(u)) {
      if (!(await urlOk(u))) continue;
    }
    next.push(ev);
  }
  return { ...project, evidence: next };
}

async function main() {
  const { globPattern, output, checkUrls } = parseArgs();
  const resolvedGlob = path.isAbsolute(globPattern)
    ? globPattern
    : path.resolve(process.cwd(), globPattern);
  const files = expandGlob(resolvedGlob);
  if (!files.length) {
    console.error(`No files matched: ${resolvedGlob}`);
    process.exit(1);
  }

  const merged: any[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.warn(`Skip ${file}: root is not an array`);
      continue;
    }
    for (const proj of data) {
      const title = typeof proj?.title === 'string' ? proj.title : '';
      const la =
        typeof proj?.localAuthorityId === 'string' ? proj.localAuthorityId : '';
      const key = `${normalizeTitle(title)}|${la}`;
      if (!title || seen.has(key)) continue;
      seen.add(key);
      merged.push(await filterEvidenceUrls(proj, checkUrls));
    }
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  console.log(`Merged ${merged.length} projects to ${output}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
