// /agents/reportAggregator.ts
// Writes/updates ProjectStatus in Postgres and pushes dashboards.
import { upsertProjectStatus } from './store';
import { ProjectStatus } from './types';

export async function aggregateAndStoreStatus(status: ProjectStatus) {
  await upsertProjectStatus(status);
  // Generate HTML dashboard
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><title>${status.name} Status</title></head>
  <body>
    <h1>${status.name} [${status.status.toUpperCase()}]</h1>
    <ul>
      ${status.evidenceTimeline.map(e => `<li><strong>${e.timestamp}</strong>: ${e.excerpt} (<a href="${e.sourceUrl}">source</a>)</li>`).join('\n      ')}
    </ul>
    <p>Last updated: ${status.lastUpdated}</p>
  </body>
  </html>`;
  // Write HTML locally (stub for S3/upload)
  const fs = await import('fs/promises');
  await fs.writeFile(`dashboard-${status.id}.html`, html, 'utf8');

  // Generate PDF (optional, using html-pdf-chrome or pdf-lib)
  // Here, we'll use a simple stub for PDF export
  // To implement: use puppeteer or html-pdf-chrome for real export
  // await somePdfLib.generatePdf(html, `dashboard-${status.id}.pdf`);

}
