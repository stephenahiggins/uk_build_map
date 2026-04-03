/**
 * Best-effort HTTP check for evidence URLs (avoids persisting obvious dead links).
 */
export async function isUrlReachable(
  url: string,
  timeoutMs = 8000
): Promise<boolean> {
  if (!/^https?:\/\//i.test(url.trim())) {
    return false;
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      signal: ac.signal,
      redirect: "follow",
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: ac.signal,
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
      });
    }
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
