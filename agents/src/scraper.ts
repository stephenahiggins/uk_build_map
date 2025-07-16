import axios from 'axios';
import * as cheerio from 'cheerio';
import { Evidence } from './types';

/**
 * Example web scraper that extracts project titles and text from a demo page.
 * Real implementation would crawl configured sources.
 */
export async function scrapeWeb(locale?: string, limit = 5): Promise<Evidence[]> {
  const results: Evidence[] = [];
  try {
    const { data } = await axios.get('https://example.com');
    const $ = cheerio.load(data);
    $('article').each((i, el) => {
      if (i >= limit) return false;
      const title = $(el).find('h2').text();
      const content = $(el).find('p').text();
      if (!locale || content.includes(locale)) {
        results.push({ title, content, source: 'example.com' });
      }
    });
  } catch (err) {
    // Fallback sample if request fails (e.g. network restrictions)
    results.push({
      title: 'Sample Project',
      content: 'Example evidence from scrape',
      source: 'sample',
    });
  }
  return results;
}
