// /agents/parser.ts
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';

export async function parseHTML(html: string): Promise<string> {
  const $ = cheerio.load(html);
  return $('body').text();
}

export async function parsePDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
