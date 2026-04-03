/**
 * When DATABASE_URL points at Docker Compose hostname `db`, host-side Node cannot resolve it.
 * Prefer BACKEND_DATABASE_URL (e.g. mysql://...@127.0.0.1:3307/...) or LOCAL_DATABASE_URL.
 * If neither is set and we are not inside Docker, host `db` is rewritten to 127.0.0.1.
 * Container port 3306 maps to host 3307 in backend/docker-compose.yml; override with DATABASE_URL_HOST_PORT.
 *
 * Call after dotenv/config and before createPrismaClient().
 */
import * as fs from 'fs';

function runningInsideDocker(): boolean {
  try {
    return fs.existsSync('/.dockerenv');
  } catch {
    return false;
  }
}

function mysqlUrlHost(url: string): string | null {
  const at = url.lastIndexOf('@');
  if (at === -1) return null;
  const rest = url.slice(at + 1);
  const hostPort = rest.split('/')[0]?.split('?')[0] ?? '';
  const host = hostPort.split(':')[0]?.trim();
  return host || null;
}

/** Replace mysql URL host after @ (e.g. db:3306 -> 127.0.0.1:3306). */
function rewriteMysqlUrlHost(url: string, newHostWithPort: string): string {
  const at = url.lastIndexOf('@');
  if (at === -1) return url;
  const afterAt = url.slice(at + 1);
  const hostPort = afterAt.split('/')[0]?.split('?')[0] ?? '';
  if (!hostPort) return url;
  return `${url.slice(0, at + 1)}${newHostWithPort}${afterAt.slice(hostPort.length)}`;
}

export function resolveDatabaseUrlForHostScripts(): void {
  const local = process.env.LOCAL_DATABASE_URL?.trim();
  if (local) {
    process.env.DATABASE_URL = local;
    return;
  }

  const primary = process.env.DATABASE_URL?.trim();
  const fallback = process.env.BACKEND_DATABASE_URL?.trim();

  if (primary && fallback) {
    const host = mysqlUrlHost(primary);
    if (host === 'db') {
      process.env.DATABASE_URL = fallback;
      return;
    }
  }

  if (!primary && fallback) {
    process.env.DATABASE_URL = fallback;
    return;
  }

  if (primary && mysqlUrlHost(primary) === 'db' && !runningInsideDocker()) {
    const afterAt = primary.slice(primary.lastIndexOf('@') + 1);
    const hostPort = afterAt.split('/')[0]?.split('?')[0] ?? '';
    const internalPort = hostPort.includes(':')
      ? (hostPort.split(':')[1] ?? '3306')
      : '3306';
    const mappedPort =
      process.env.DATABASE_URL_HOST_PORT?.trim() ||
      (internalPort === '3306' ? '3307' : internalPort);
    process.env.DATABASE_URL = rewriteMysqlUrlHost(
      primary,
      `127.0.0.1:${mappedPort}`
    );
  }
}
