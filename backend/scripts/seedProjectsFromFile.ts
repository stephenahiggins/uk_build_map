import { createPrismaClient } from '../src/lib/createPrismaClient';
import { Prisma, ProjectType, ProjectStatus, EvidenceType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = createPrismaClient();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      'Usage: ts-node scripts/seedProjectsFromFile.ts <projects.seed.json>'
    );
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  let projects;
  try {
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    projects = JSON.parse(fileContent);
    if (!Array.isArray(projects)) throw new Error('JSON root must be an array');
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  const normalizeProjectType = (value: string) => {
    const normalized = value.toUpperCase();
    if (normalized === 'LOCAL') return 'LOCAL_GOV';
    if (normalized === 'REGIONAL') return 'REGIONAL_GOV';
    if (normalized === 'NATIONAL') return 'NATIONAL_GOV';
    return normalized;
  };

  const normalizeProjectStatus = (value?: string) => {
    if (!value) return 'AMBER';
    const normalized = value.toUpperCase();
    if (normalized === 'RED' || normalized === 'AMBER' || normalized === 'GREEN') {
      return normalized;
    }
    if (
      normalized.includes('COMPLETE') ||
      normalized.includes('COMPLETED') ||
      normalized.includes('OPERATIONAL')
    ) {
      return 'GREEN';
    }
    if (
      normalized.includes('CANCEL') ||
      normalized.includes('SUSPENDED') ||
      normalized.includes('STOPPED') ||
      normalized.includes('PAUSED')
    ) {
      return 'RED';
    }
    if (
      normalized.includes('UNDER_CONSTRUCTION') ||
      normalized.includes('CONSTRUCTION') ||
      normalized.includes('DELIVERY') ||
      normalized.includes('PLANNED') ||
      normalized.includes('PHASED') ||
      normalized.includes('FUNDING') ||
      normalized.includes('PROCUREMENT') ||
      normalized.includes('DESIGN') ||
      normalized.includes('IN_PROGRESS') ||
      normalized.includes('ON_TRACK') ||
      normalized.includes('AT_RISK')
    ) {
      return 'AMBER';
    }
    return 'AMBER';
  };

  const isPlaceholderId = (value?: string) =>
    !!value && /^<.+>$/.test(value);

  const isUuid = (value?: string) =>
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );

  const resolveRegionId = async (regionName?: string) => {
    if (!regionName) return undefined;
    const region = await prisma.region.findUnique({
      where: { name: regionName },
      select: { id: true },
    });
    return region?.id;
  };

  const ensureRegionId = async (
    regionId?: string,
    regionName?: string
  ): Promise<string | undefined> => {
    if (regionId) {
      if (isPlaceholderId(regionId)) return undefined;
      if (!isUuid(regionId)) {
        const resolved = await resolveRegionId(regionId);
        return resolved;
      }
      const exists = await prisma.region.findUnique({
        where: { id: regionId },
        select: { id: true },
      });
      return exists?.id;
    }
    if (regionName) {
      return resolveRegionId(regionName);
    }
    return undefined;
  };

  const resolveLocalAuthorityId = async (
    localAuthorityCode?: string,
    localAuthorityName?: string
  ) => {
    if (localAuthorityCode) {
      const byCode = await prisma.localAuthority.findUnique({
        where: { code: localAuthorityCode },
        select: { id: true },
      });
      if (byCode?.id) return byCode.id;
    }
    if (localAuthorityName) {
      const byName = await prisma.localAuthority.findFirst({
        where: { name: localAuthorityName },
        select: { id: true },
      });
      if (byName?.id) return byName.id;
    }
    return undefined;
  };

  const ensureLocalAuthorityId = async (
    localAuthorityId?: string,
    localAuthorityCode?: string,
    localAuthorityName?: string
  ): Promise<string | undefined> => {
    if (localAuthorityId) {
      if (isPlaceholderId(localAuthorityId)) return undefined;
      if (!isUuid(localAuthorityId)) {
        const resolved = await resolveLocalAuthorityId(
          localAuthorityId,
          localAuthorityName
        );
        return resolved;
      }
      const exists = await prisma.localAuthority.findUnique({
        where: { id: localAuthorityId },
        select: { id: true },
      });
      return exists?.id;
    }
    return resolveLocalAuthorityId(localAuthorityCode, localAuthorityName);
  };

  for (const project of projects) {
    try {
      // Ensure createdById is set to 1 if not provided
      // Remove createdBy property if present
      const {
        createdBy,
        evidence,
        regionName,
        localAuthorityCode,
        localAuthorityName,
        ...rest
      } = project;
      const projectData = {
        ...rest,
        createdById: project.createdById ?? 1,
      } as Prisma.ProjectUncheckedCreateInput;
      // don't include 'evidence' in projectData
      if (typeof projectData.type === 'string') {
        projectData.type = normalizeProjectType(
          projectData.type as string
        ) as ProjectType;
      }
      projectData.status = normalizeProjectStatus(
        typeof projectData.status === 'string'
          ? (projectData.status as string)
          : undefined
      ) as ProjectStatus;
      if (
        typeof projectData.expectedCompletion === 'string' &&
        projectData.expectedCompletion.length > 0
      ) {
        projectData.expectedCompletion = new Date(
          projectData.expectedCompletion as string
        );
      }
      const resolvedRegionId = await ensureRegionId(
        typeof projectData.regionId === 'string'
          ? (projectData.regionId as string)
          : undefined,
        typeof regionName === 'string' ? regionName : undefined
      );
      if (resolvedRegionId) {
        projectData.regionId = resolvedRegionId;
      } else if (projectData.regionId && typeof projectData.regionId === 'string') {
        console.warn(
          `Warning: region not found for id/name "${projectData.regionId}" (project ${project.id})`
        );
        delete projectData.regionId;
      }
      const resolvedLocalAuthorityId = await ensureLocalAuthorityId(
        typeof projectData.localAuthorityId === 'string'
          ? (projectData.localAuthorityId as string)
          : undefined,
        typeof localAuthorityCode === 'string' ? localAuthorityCode : undefined,
        typeof localAuthorityName === 'string' ? localAuthorityName : undefined
      );
      if (resolvedLocalAuthorityId) {
        projectData.localAuthorityId = resolvedLocalAuthorityId;
      } else if (
        projectData.localAuthorityId &&
        typeof projectData.localAuthorityId === 'string'
      ) {
        console.warn(
          `Warning: local authority not found for id/code/name "${projectData.localAuthorityId}" (project ${project.id})`
        );
        delete projectData.localAuthorityId;
      }

      if (typeof projectData.statusRationale === 'string') {
        const maxLength = 191;
        if (projectData.statusRationale.length > maxLength) {
          projectData.statusRationale = projectData.statusRationale.slice(
            0,
            maxLength
          );
        }
      }

      // Adjust the fields below to match your Prisma schema
      const seededProject = await prisma.project.upsert({
        where: { id: project.id },
        update: {},
        create: projectData,
      });

      // Seed evidence items if present
      if (Array.isArray(project.evidence) && project.evidence.length > 0) {
        type EvidenceSeed = {
          type: string;
          title: string;
          summary?: string;
          source?: string;
          url?: string;
          datePublished?: string;
        };
        const evidenceItems = project.evidence
          .map((evidence: EvidenceSeed) => {
            if (!evidence?.type || !evidence?.title) return null;
            const normalizedType = evidence.type.toUpperCase();
            if (!['PDF', 'URL', 'TEXT', 'DATE'].includes(normalizedType)) {
              console.warn(
                `Warning: skipping evidence with invalid type "${evidence.type}" (project ${project.id})`
              );
              return null;
            }
            return {
              projectId: seededProject.id,
              submittedById: 1, // Default admin user
              type: normalizedType as EvidenceType,
              title: evidence.title,
              summary: evidence.summary,
              source: evidence.source,
              url: evidence.url,
              datePublished: evidence.datePublished
                ? new Date(evidence.datePublished)
                : undefined,
            };
          })
          .filter(Boolean) as Prisma.EvidenceItemCreateManyInput[];
        await prisma.evidenceItem.createMany({
          data: evidenceItems,
          skipDuplicates: true,
        });
        console.log(
          `  Seeded ${evidenceItems.length} evidence items for project: ${project.title || project.id}`
        );
      }
      console.log(`Seeded: ${project.title || project.id}`);
      successCount++;
    } catch (e) {
      console.error(`Failed to seed project ${project.id}:`, e);
      failCount++;
    }
  }
  console.log(
    `\nSeeding complete. Success: ${successCount}, Failed: ${failCount}`
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
