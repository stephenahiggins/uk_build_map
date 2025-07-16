import axios from 'axios';
import { Evidence } from './types';

/**
 * Query data.gov.uk for packages related to planning. Results are simplified
 * for demonstration purposes.
 */
export async function fetchGovData(locale?: string, limit = 5): Promise<Evidence[]> {
  const results: Evidence[] = [];
  try {
    const url = `https://data.gov.uk/api/3/action/package_search?q=planning&rows=${limit}`;
    const { data } = await axios.get(url);
    const items = data.result?.results || [];
    for (const item of items) {
      const title: string = item.title;
      const content: string = item.notes || '';
      if (!locale || content.includes(locale) || title.includes(locale)) {
        results.push({ title, content, source: 'data.gov.uk' });
      }
    }
  } catch {
    // Fallback entry when network access fails
    results.push({ title: 'Gov Data Sample', content: 'Example API evidence', source: 'sample' });
  }
  return results.slice(0, limit);
}
