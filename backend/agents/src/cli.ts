// /src/cli.ts
import { Command } from 'commander';
import { discoverProjects } from './discoveryAgent';
import { harvestEvidence } from './evidenceAgent';
import { mergeTimelines } from './timelineMerger';
import { scoreRAG } from './ragScorer';
import { aggregateAndStoreStatus } from './reportAggregator';
import { db } from './store';
import { ProjectStatus } from './types';

const program = new Command();

// Re-index: Full sweep for all projects (Discovery → Evidence → RAG → Store)
program
  .command('reindex')
  .description('Sweep all projects and update their status')
  .action(async () => {
    console.log('🔎 Discovering projects...');
    const projects = await discoverProjects();
    console.log(`Found ${projects.length} projects.`);
    for (const project of projects) {
      try {
        console.log(`\n📝 Harvesting evidence for: ${project.name}`);
        const evidence = await harvestEvidence(project);
        const timeline = mergeTimelines(evidence);
        const rag = scoreRAG(timeline);
        const status: ProjectStatus = {
          id: project.id,
          name: project.name,
          status: rag.status,
          evidenceTimeline: timeline,
          lastUpdated: new Date().toISOString(),
        };
        await aggregateAndStoreStatus(status);
        console.log(`✅ ${project.name}: ${rag.status.toUpperCase()} (${rag.explanation})`);
      } catch (e) {
        console.error(`❌ Error processing ${project.name}:`, e);
      }
    }
    process.exit(0);
  });

// Status: Show all project statuses
program
  .command('status')
  .description('Show all project statuses')
  .action(async () => {
    const rows = await db('project_status').select('*');
    for (const row of rows) {
      console.log(`${row.name} [${row.status}] (updated ${row.lastUpdated})`);
    process.exit(0);
  });

// Evidence: Show evidence timeline for a project
program
  .command('evidence <projectId>')
  .description('Show evidence timeline for a given project')
  .action(async (projectId: string) => {
    const row = await db('project_status').where({ id: projectId }).first();
    if (!row) {
      console.error('Project not found');
      process.exit(1);
    }
    console.log(`Evidence timeline for ${row.name}:`);
    for (const item of row.evidenceTimeline) {
      console.log(`- [${item.timestamp}] ${item.excerpt} (${item.sourceUrl})`);
    }
    process.exit(0);
  });

program.parse(process.argv);

export { program };
