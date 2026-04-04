import { Prisma, PrismaClient, ProjectType, ProjectStatus, EvidenceType } from '@prisma/client';

export type SeedProjectsResult = {
  successCount: number;
  failCount: number;
};

/**
 * Inserts projects + evidence from parsed JSON. Existing projects are left unchanged
 * (upsert with empty update). Does not disconnect prisma.
 */
export async function seedProjectsArray(
  prisma: PrismaClient,
  projects: unknown[]
): Promise<SeedProjectsResult> {
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

  const isPlaceholderId = (value?: string) => !!value && /^<.+>$/.test(value);

  const isUuid = (value?: string) =>
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

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
      if (!project || typeof project !== 'object') {
        failCount++;
        continue;
      }
      const p = project as Record<string, unknown>;
      if (typeof p.id !== 'string') {
        failCount++;
        continue;
      }

      const {
        createdBy: _createdBy,
        evidence,
        regionName,
        localAuthorityCode,
        localAuthorityName,
        createdById: seedCreatedById,
        ...rest
      } = p;
      const projectData = {
        ...rest,
        createdById: (seedCreatedById as number | undefined) ?? 1,
      } as Prisma.ProjectUncheckedCreateInput;

      if (typeof projectData.type === 'string') {
        projectData.type = normalizeProjectType(projectData.type as string) as ProjectType;
      }
      projectData.status = normalizeProjectStatus(
        typeof projectData.status === 'string' ? (projectData.status as string) : undefined
      ) as ProjectStatus;
      if (
        typeof projectData.expectedCompletion === 'string' &&
        projectData.expectedCompletion.length > 0
      ) {
        projectData.expectedCompletion = new Date(projectData.expectedCompletion as string);
      }
      const resolvedRegionId = await ensureRegionId(
        typeof projectData.regionId === 'string' ? (projectData.regionId as string) : undefined,
        typeof regionName === 'string' ? regionName : undefined
      );
      if (resolvedRegionId) {
        projectData.regionId = resolvedRegionId;
      } else if (projectData.regionId && typeof projectData.regionId === 'string') {
        console.warn(
          `Warning: region not found for id/name "${projectData.regionId}" (project ${p.id})`
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
          `Warning: local authority not found for id/code/name "${projectData.localAuthorityId}" (project ${p.id})`
        );
        delete projectData.localAuthorityId;
      }

      if (typeof projectData.statusRationale === 'string') {
        const maxLength = 191;
        if (projectData.statusRationale.length > maxLength) {
          projectData.statusRationale = projectData.statusRationale.slice(0, maxLength);
        }
      }

      const seededProject = await prisma.project.upsert({
        where: { id: p.id as string },
        update: {},
        create: projectData,
      });

      if (Array.isArray(evidence) && evidence.length > 0) {
        type EvidenceSeed = {
          type: string;
          title: string;
          summary?: string;
          source?: string;
          url?: string;
          datePublished?: string;
        };
        const evidenceItems = evidence
          .map((evidenceRow: EvidenceSeed) => {
            if (!evidenceRow?.type || !evidenceRow?.title) return null;
            const normalizedType = evidenceRow.type.toUpperCase();
            if (!['PDF', 'URL', 'TEXT', 'DATE'].includes(normalizedType)) {
              console.warn(
                `Warning: skipping evidence with invalid type "${evidenceRow.type}" (project ${p.id})`
              );
              return null;
            }
            return {
              projectId: seededProject.id,
              submittedById: 1,
              type: normalizedType as EvidenceType,
              title: evidenceRow.title,
              summary: evidenceRow.summary,
              source: evidenceRow.source,
              url: evidenceRow.url,
              datePublished: evidenceRow.datePublished
                ? new Date(evidenceRow.datePublished)
                : undefined,
            };
          })
          .filter(Boolean) as Prisma.EvidenceItemCreateManyInput[];

        const urls = evidenceItems.map((row) => row.url).filter((u): u is string => Boolean(u));
        let toInsert = evidenceItems;
        if (urls.length > 0) {
          const existing = await prisma.evidenceItem.findMany({
            where: { projectId: seededProject.id, url: { in: urls } },
            select: { url: true },
          });
          const seen = new Set(
            existing.map((row) => row.url).filter((u): u is string => Boolean(u))
          );
          toInsert = evidenceItems.filter((row) => !row.url || !seen.has(row.url));
        }

        if (toInsert.length > 0) {
          await prisma.evidenceItem.createMany({
            data: toInsert,
            skipDuplicates: true,
          });
          console.log(
            `  Seeded ${toInsert.length} new evidence item(s) for project: ${p.title || p.id}`
          );
        }
      }
      console.log(`Seeded: ${p.title || p.id}`);
      successCount++;
    } catch (e) {
      const id =
        project && typeof project === 'object' && typeof (project as { id?: string }).id === 'string'
          ? (project as { id: string }).id
          : '?';
      console.error(`Failed to seed project ${id}:`, e);
      failCount++;
    }
  }

  return { successCount, failCount };
}
