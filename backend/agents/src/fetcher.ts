// /agents/fetcher.ts
import axios from 'axios';
import Parser from 'rss-parser';

export type FetchResult = {
  url: string;
  status: number;
  contentType: string;
  data: string | Buffer;
};

export async function fetchUrl(url: string, retries = 3): Promise<FetchResult> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      return {
        url,
        status: resp.status,
        contentType: resp.headers['content-type'] || '',
        data: resp.data,
      };
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export async function fetchCKAN(apiUrl: string, params?: Record<string, any>) {
  const resp = await axios.get(apiUrl, { params });
  return resp.data;
}

export async function fetchRSS(feedUrl: string) {
  const parser = new Parser();
  return parser.parseURL(feedUrl);
}
