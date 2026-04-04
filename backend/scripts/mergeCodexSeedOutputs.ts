import * as fs from 'fs';
import * as path from 'path';

const URL_CHECK_CONCURRENCY = 12;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function urlOk(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: { Range: 'bytes=0-0' },
      });
    }
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workerCount = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let globPattern = path.join(process.cwd(), 'seeds', 'codex-batches', 'out', '*.json');
  let output = path.join(process.cwd(), 'seeds', 'merged-from-codex.json');
  let allowFailedUrls = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--glob' && argv[i + 1]) {
      globPattern = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (arg === '--output' && argv[i + 1]) {
      output = path.resolve(process.cwd(), argv[++i]);
      continue;
    }
    if (arg === '--allow-failed-urls') {
      allowFailedUrls = true;
    }
  }

  return { globPattern, output, allowFailedUrls };
}

function expandGlob(pattern: string): string[] {
  const directory = path.dirname(pattern);
  const basename = path.basename(pattern);
  const [prefix, suffix] = basename.split('*');
  const finalizedBatchFile = /^batch-\d{3}\.json$/;
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.startsWith(prefix) && file.endsWith(suffix || ''))
    .filter((file) => finalizedBatchFile.test(file))
    .map((file) => path.join(directory, file))
    .sort();
}

function tryParseJsonArray(file: string): any[] | undefined {
  try {
    const payload = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(payload) ? payload : undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Skipping unreadable batch output ${file}: ${message}`);
    return undefined;
  }
}

async function main() {
  const { globPattern, output, allowFailedUrls } = parseArgs();
  const files = expandGlob(globPattern);
  if (files.length === 0) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, '[]\n', 'utf-8');
    console.warn(`No batch outputs matched ${globPattern}; wrote empty merge output to ${output}`);
    return;
  }

  const seen = new Set<string>();
  const merged: any[] = [];

  for (const file of files) {
    const payload = tryParseJsonArray(file);
    if (!payload) {
      continue;
    }

    for (const project of payload) {
      const dedupeKey = [
        normalize(String(project.title || '')),
        String(project.localAuthorityId || '').trim(),
        normalize(
          String(project.locationDescription || project.localAuthorityName || project.regionName || '')
        ),
      ].join('|');

      if (!project.title || seen.has(dedupeKey)) continue;

      const projectEvidence: any[] = Array.isArray(project.evidence) ? project.evidence : [];
      const nextEvidence = (
        await mapWithConcurrency<any, any | undefined>(
          projectEvidence,
          URL_CHECK_CONCURRENCY,
          async (evidence) => {
            const url = typeof evidence?.url === 'string' ? evidence.url : '';
            if (!url) {
              return evidence;
            }
            if (!/^https?:\/\//i.test(url)) {
              return undefined;
            }
            if (allowFailedUrls || (await urlOk(url))) {
              return evidence;
            }
            return undefined;
          }
        )
      ).filter((evidence): evidence is NonNullable<typeof evidence> => Boolean(evidence));

      seen.add(dedupeKey);
      merged.push({
        ...project,
        evidence: nextEvidence,
      });
    }
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(merged, null, 2)}\n`, 'utf-8');
  console.log(`Merged ${merged.length} Codex-seeded projects to ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
