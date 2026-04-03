import * as fs from 'fs';
import * as path from 'path';

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
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.startsWith(prefix) && file.endsWith(suffix || ''))
    .map((file) => path.join(directory, file))
    .sort();
}

async function main() {
  const { globPattern, output, allowFailedUrls } = parseArgs();
  const files = expandGlob(globPattern);
  if (files.length === 0) {
    throw new Error(`No batch outputs matched ${globPattern}`);
  }

  const seen = new Set<string>();
  const merged: any[] = [];

  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!Array.isArray(payload)) continue;

    for (const project of payload) {
      const dedupeKey = [
        normalize(String(project.title || '')),
        String(project.localAuthorityId || '').trim(),
        normalize(
          String(project.locationDescription || project.localAuthorityName || project.regionName || '')
        ),
      ].join('|');

      if (!project.title || seen.has(dedupeKey)) continue;

      const nextEvidence = [];
      for (const evidence of Array.isArray(project.evidence) ? project.evidence : []) {
        const url = typeof evidence?.url === 'string' ? evidence.url : '';
        if (!url) {
          nextEvidence.push(evidence);
          continue;
        }
        if (!/^https?:\/\//i.test(url)) {
          if (allowFailedUrls) continue;
          continue;
        }
        if (allowFailedUrls || (await urlOk(url))) {
          nextEvidence.push(evidence);
        }
      }

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
