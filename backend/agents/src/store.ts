// /agents/store.ts
import knex from 'knex';
import { ProjectStatus } from './types';
import dotenv from 'dotenv';
dotenv.config();

export const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

export async function upsertProjectStatus(status: ProjectStatus) {
  await db('project_status')
    .insert(status)
    .onConflict('id')
    .merge();
}
