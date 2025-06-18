// /agents/discoveryAgent.ts
// Discovers all UK government projects from data.gov.uk, GOV.UK API Catalogue, and Council RSS feeds.
// Populates or refreshes the project registry.
import axios from 'axios';
import Parser from 'rss-parser';

export async function discoverProjects(): Promise<{ id: string; name: string; url: string; }[]> {
  // Example: fetch from data.gov.uk CKAN API
  const ckanProjects = await axios.get('https://data.gov.uk/api/3/action/package_search', {
    params: { q: 'project', rows: 1000 }
  });
  // Example: parse RSS feeds (stubbed)
  const parser = new Parser();
  // const councilFeed = await parser.parseURL('https://example-council.gov.uk/rss/projects');
  // Merge and deduplicate
  return ckanProjects.data.result.results.map((pkg: any) => ({
    id: pkg.id,
    name: pkg.title,
    url: pkg.url || pkg.resources?.[0]?.url || ''
  }));
}
