import { promises as fs } from 'fs';
import path from 'path';
import { EvidenceRecord } from './types';

const dbPath = path.join(process.cwd(), 'data');
const filePath = path.join(dbPath, 'evidence.json');

async function readAll(): Promise<EvidenceRecord[]> {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function saveEvidence(record: EvidenceRecord): Promise<void> {
  const items = await readAll();
  if (items.find((i) => i.title === record.title)) {
    console.log('Skipping existing', record.title);
    return;
  }
  items.push(record);
  await fs.mkdir(dbPath, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(items, null, 2));
  console.log('Saved evidence', record.title);
}
