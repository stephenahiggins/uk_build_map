// /agents/evidenceAgent.ts
// Forked per project. Fetches sources, parses, and populates EvidenceItems.
import { fetchUrl, fetchCKAN, fetchRSS } from './fetcher';
import { parseHTML, parsePDF } from './parser';
import { embedText } from './embedder';
import { EvidenceItem } from './types';

export async function harvestEvidence(project: { id: string; name: string; url: string }): Promise<EvidenceItem[]> {
  // Example: fetch main project page
  const results: EvidenceItem[] = [];
  try {
    const fetchRes = await fetchUrl(project.url);
    let text = '';
    if (fetchRes.contentType.includes('html')) {
      text = await parseHTML(fetchRes.data.toString());
    } else if (fetchRes.contentType.includes('pdf')) {
      text = await parsePDF(Buffer.from(fetchRes.data));
    }
    // Extract facts/timestamps using regex (simple date + sentence extraction)
    const factRegex = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2} \w+ \d{4})[\s\S]{0,40}?([^.?!]{20,200}[.?!])/gi;
    let match;
    let found = false;
    while ((match = factRegex.exec(text)) !== null) {
      found = true;
      results.push({
        timestamp: new Date(match[1]).toISOString(),
        excerpt: match[2].trim(),
        sourceUrl: project.url
      });
    }
    // Fallback: just push a generic excerpt if no facts found
    if (!found) {
      results.push({
        timestamp: new Date().toISOString(),
        excerpt: text.slice(0, 256),
        sourceUrl: project.url
      });
    }
  } catch (e) {
    // Log and continue
  }
  // Fetch additional sources (RSS, CKAN, Hansard, etc.)
  try {
    // Example: fetch RSS feed for project (stub: project.url + '/rss')
    const rssUrl = project.url.endsWith('/') ? project.url + 'rss' : project.url + '/rss';
    const rss = await fetchRSS(rssUrl).catch(() => null);
    if (rss && rss.items) {
      for (const item of rss.items) {
        results.push({
          timestamp: item.isoDate || new Date().toISOString(),
          excerpt: item.title || item.contentSnippet || '',
          sourceUrl: item.link || rssUrl
        });
      }
    }
    // Example: fetch CKAN datasets for project (stub: using project.name)
    const ckan = await fetchCKAN('https://data.gov.uk/api/3/action/package_search', { q: project.name, rows: 3 }).catch(() => null);
    if (ckan && ckan.result && ckan.result.results) {
      for (const ds of ckan.result.results) {
        results.push({
          timestamp: new Date().toISOString(),
          excerpt: ds.title,
          sourceUrl: ds.url || ''
        });
      }
    }
    // Hansard, FOIA, etc. can be added here.
  } catch (e) {
    // Ignore errors from extra sources
  }
  return results;
}

