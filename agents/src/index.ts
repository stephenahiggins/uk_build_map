import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { scrapeWeb } from './scraper';
import { fetchGovData } from './govApi';
import { saveEvidence } from './db';
import { summarise } from '../example';
import { EvidenceRecord } from './types';

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('locale', { type: 'string', default: process.env.LOCALE })
    .option('limit', { type: 'number', default: Number(process.env.MAX_RESULTS) || 5 })
    .parseSync();

  const { locale, limit } = argv;

  const scraped = await scrapeWeb(locale, limit);
  const apiData = await fetchGovData(locale, limit);

  const items = [...scraped, ...apiData].slice(0, limit);

  for (const item of items) {
    const summary = await summarise(item.content);
    const record: EvidenceRecord = { ...item, summary };
    await saveEvidence(record);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
