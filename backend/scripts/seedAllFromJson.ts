import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';
import { seedProjectsArray } from './lib/seedProjectsArray';

resolveDatabaseUrlForHostScripts();

const SEEDS_DIR = path.join(process.cwd(), 'seeds');

/** Files that are never project-array seeds */
const SKIP_BASENAMES = new Set([
  'authority-coverage.snapshot.json',
  'local-authorities.json',
]);

function parseArgs() {
  const argv = process.argv.slice(2);
  let roots: string[] = [];
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if ((arg === '--roots' || arg === '-r') && argv[i + 1]) {
      roots = argv[++i]
        .split(',')
        .map((segment) => path.resolve(segment.trim()))
        .filter(Boolean);
      continue;
    }
  }

  if (roots.length === 0) {
    roots = [SEEDS_DIR];
  }

  return { roots, dryRun };
}

function collectJsonFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(current: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'archive' || entry.name === 'node_modules') continue;
        walk(full);
      } else if (entry.name.endsWith('.json')) {
        results.push(full);
      }
    }
  }

  walk(rootDir);
  return results.sort();
}

function shouldSkipPath(filePath: string): boolean {
  const base = path.basename(filePath);
  if (SKIP_BASENAMES.has(base)) return true;
  if (base.endsWith('-authorities.json')) return true;
  if (base.includes('.tmp.') || /\.tmp\.json$/i.test(base)) return true;
  const normalized = filePath.split(path.sep).join('/');
  if (normalized.includes('/archive/')) return true;
  return false;
}

/**
 * Distinguish project seed arrays from local-authority exports and similar.
 */
function isLikelyProjectSeedArray(parsed: unknown): boolean {
  if (!Array.isArray(parsed) || parsed.length === 0) return false;
  const head = parsed.slice(0, Math.min(5, parsed.length));
  let objects = 0;
  let withTitle = 0;
  for (const item of head) {
    if (!item || typeof item !== 'object') continue;
    objects++;
    const title = (item as Record<string, unknown>).title;
    if (typeof title === 'string' && title.trim().length > 0) withTitle++;
  }
  return objects > 0 && withTitle / objects >= 0.6;
}

async function main() {
  const { roots, dryRun } = parseArgs();
  const allFiles = new Set<string>();
  for (const root of roots) {
    if (!fs.existsSync(root)) {
      console.warn(`Skipping missing directory: ${root}`);
      continue;
    }
    for (const file of collectJsonFiles(root)) {
      allFiles.add(file);
    }
  }

  const candidates = Array.from(allFiles).filter((f) => !shouldSkipPath(f)).sort();

  const toRun: string[] = [];
  for (const filePath of candidates) {
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.warn(`Unreadable, skipping: ${filePath}`, e);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn(`Invalid JSON, skipping: ${filePath}`);
      continue;
    }
    if (!isLikelyProjectSeedArray(parsed)) {
      console.log(`Skip (not a project array): ${path.relative(process.cwd(), filePath)}`);
      continue;
    }
    toRun.push(filePath);
  }

  console.log(
    `Found ${toRun.length} project seed file(s) under ${roots.map((r) => path.relative(process.cwd(), r)).join(', ')}`
  );

  if (dryRun) {
    for (const f of toRun) {
      console.log(`  would seed: ${path.relative(process.cwd(), f)}`);
    }
    return;
  }

  const prisma = createPrismaClient();
  let totalSuccess = 0;
  let totalFail = 0;

  try {
    for (const filePath of toRun) {
      const rel = path.relative(process.cwd(), filePath);
      const projects = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown[];
      console.log(`\n--- ${rel} (${projects.length} record(s)) ---`);
      const { successCount, failCount } = await seedProjectsArray(prisma, projects);
      totalSuccess += successCount;
      totalFail += failCount;
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nseed-all complete. Total success: ${totalSuccess}, total failed: ${totalFail}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
