import 'dotenv/config';
import { Prisma, ProjectStatus as PrismaProjectStatus } from '@prisma/client';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import { evaluateProjectDeterministically } from '../src/lib/projectEvaluation';
import { resolveGeoAssignments } from '../src/lib/geoLookup';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';

resolveDatabaseUrlForHostScripts();

const prisma = createPrismaClient();

type PrismaStatus = PrismaProjectStatus;

type Mode = 'coords-only' | 'evaluation';

function parseMode(argv: string[]): Mode {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`
Usage: ts-node scripts/recomputeProjectEvaluations.ts [options]

Runs deterministic evaluation over projects and updates RAG status, rationale, coordinates, and geo fields.

Options:
  --mode coords-only   Only projects missing latitude or longitude (default).
  --mode evaluation    All projects — full RAG recompute using existing evidence.

MOCK_PROJECT_EVALUATION=true uses mock evaluation responses.
`);
      process.exit(0);
    }
    if (a === '--mode' && argv[i + 1]) {
      const v = argv[i + 1].toLowerCase();
      if (v === 'coords-only' || v === 'evaluation') return v as Mode;
      throw new Error(`Unknown --mode value: ${argv[i + 1]}`);
    }
    const eq = a.match(/^--mode=(.+)$/);
    if (eq) {
      const v = eq[1].toLowerCase();
      if (v === 'coords-only' || v === 'evaluation') return v as Mode;
      throw new Error(`Unknown --mode value: ${eq[1]}`);
    }
  }
  return 'coords-only';
}

function toPrismaStatus(status: 'Red' | 'Amber' | 'Green'): PrismaStatus {
  switch (status) {
    case 'Red':
      return 'RED';
    case 'Green':
      return 'GREEN';
    default:
      return 'AMBER';
  }
}

function projectWhereForMode(mode: Mode): Prisma.ProjectWhereInput {
  if (mode === 'evaluation') {
    return {};
  }
  return {
    OR: [{ latitude: null }, { longitude: null }],
  };
}

async function recompute() {
  const mode = parseMode(process.argv.slice(2));
  const mock = process.env.MOCK_PROJECT_EVALUATION === 'true';

  const where = projectWhereForMode(mode);

  const projects = await prisma.project.findMany({
    where,
    include: {
      evidence: {
        orderBy: {
          datePublished: 'desc',
        },
      },
      region: true,
      localAuthority: true,
    },
  });

  console.log(
    `Mode: ${mode}. Found ${projects.length} project(s) to evaluate.`
  );

  for (const project of projects) {
    try {
      const evaluation = evaluateProjectDeterministically(
        {
          projectName: project.title,
          projectDescription: project.description || undefined,
          locale: project.region?.name || undefined,
          evidence: project.evidence.map((item) => ({
            title: item.title || undefined,
            summary: item.summary || undefined,
            source: item.source || undefined,
            sourceUrl: item.url || undefined,
            evidenceDate: item.datePublished
              ? item.datePublished.toISOString().slice(0, 10)
              : undefined,
            rawText: item.description || undefined,
          })),
        },
        {
          mockResponse: mock,
        }
      );

      console.log(
        `Updating ${project.title} -> status ${evaluation.ragStatus} (${evaluation.ragRationale || 'no rationale'})`
      );

      const existingLat =
        project.latitude != null ? Number(project.latitude) : null;
      const existingLng =
        project.longitude != null ? Number(project.longitude) : null;

      const nextLat =
        mode === 'evaluation'
          ? (evaluation.latitude ?? existingLat)
          : evaluation.latitude;
      const nextLng =
        mode === 'evaluation'
          ? (evaluation.longitude ?? existingLng)
          : evaluation.longitude;

      const derivedGeo = await resolveGeoAssignments(nextLat, nextLng);

      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: toPrismaStatus(evaluation.ragStatus),
          statusRationale: evaluation.ragRationale,
          statusUpdatedAt: new Date(),
          latitude: nextLat,
          longitude: nextLng,
          locationDescription:
            evaluation.locationDescription || project.locationDescription || null,
          locationSource:
            evaluation.locationSource || project.locationSource || null,
          locationConfidence:
            evaluation.locationConfidence ?? project.locationConfidence ?? null,
          regionId: derivedGeo.regionId ?? project.regionId,
          localAuthorityId:
            derivedGeo.localAuthorityId ?? project.localAuthorityId,
        },
      });
    } catch (error) {
      console.error(
        `Failed to evaluate project ${project.id} (${project.title})`,
        error
      );
    }
  }
}

recompute()
  .catch((error) => {
    console.error('Failed to recompute project evaluations', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
