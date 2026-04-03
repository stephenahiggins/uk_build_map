import { PrismaClient } from '@prisma/client';

type CoverageProject = {
  id: string;
  title: string;
  status: string;
  latitude: unknown;
  longitude: unknown;
  updatedAt: Date;
  evidence: Array<{
    id: string;
    url: string | null;
    datePublished: Date | null;
  }>;
};

const STALE_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function daysAgo(date: Date | null | undefined): number | null {
  if (!date) return null;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / MS_PER_DAY));
}

function latestEvidenceDate(projects: CoverageProject[]): Date | null {
  let latest: Date | null = null;
  for (const project of projects) {
    for (const evidence of project.evidence) {
      if (!evidence.datePublished) continue;
      if (!latest || evidence.datePublished > latest) {
        latest = evidence.datePublished;
      }
    }
  }
  return latest;
}

function latestEvidenceDateForProject(project: CoverageProject): Date | null {
  let latest: Date | null = null;
  for (const evidence of project.evidence) {
    if (!evidence.datePublished) continue;
    if (!latest || evidence.datePublished > latest) {
      latest = evidence.datePublished;
    }
  }
  return latest;
}

function computePriority(projectCount: number, staleProjectCount: number, mappingQuality: string): string {
  if (projectCount === 0) return 'CRITICAL';
  if (staleProjectCount > 0 || mappingQuality === 'POOR') return 'HIGH';
  if (mappingQuality === 'FAIR') return 'MEDIUM';
  return 'LOW';
}

export async function buildAuthorityCoverageSnapshot(prisma: PrismaClient) {
  const [authorities, unassignedProjectCount] = await Promise.all([
    prisma.localAuthority.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        website: true,
        countryCode: true,
        regionId: true,
        boundaryPolygon: true,
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            latitude: true,
            longitude: true,
            updatedAt: true,
            evidence: {
              select: {
                id: true,
                url: true,
                datePublished: true,
              },
            },
          },
        },
      },
    }),
    prisma.project.count({
      where: { localAuthorityId: null },
    }),
  ]);

  const regions = await prisma.region.findMany({
    where: {
      id: {
        in: Array.from(new Set(authorities.map((authority) => authority.regionId))),
      },
    },
    select: { id: true, name: true },
  });
  const regionNameById = new Map(regions.map((region) => [region.id, region.name]));

  const rows = authorities.map((authority) => {
    const projects = authority.projects as CoverageProject[];
    const projectCount = projects.length;
    const latestEvidence = latestEvidenceDate(projects);
    const staleProjectCount = projects.filter((project) => {
      const latestForProject = latestEvidenceDateForProject(project);
      const age = daysAgo(latestForProject);
      return age === null || age > STALE_DAYS;
    }).length;
    const projectsWithCoordinates = projects.filter((project) => {
      const latitude = toNumber(project.latitude);
      const longitude = toNumber(project.longitude);
      return latitude !== null && longitude !== null;
    }).length;
    const verifiedEvidenceCount = projects.reduce((sum, project) => {
      return sum + project.evidence.filter((item) => Boolean(item.url)).length;
    }, 0);
    const evidenceCount = projects.reduce((sum, project) => sum + project.evidence.length, 0);

    const mappingRatio = projectCount === 0 ? 0 : projectsWithCoordinates / projectCount;
    const mappingQuality =
      mappingRatio >= 0.85 ? 'GOOD' : mappingRatio >= 0.5 ? 'FAIR' : 'POOR';

    return {
      id: authority.id,
      name: authority.name,
      code: authority.code,
      website: authority.website,
      countryCode: authority.countryCode,
      regionId: authority.regionId ?? null,
      regionName: authority.regionId ? regionNameById.get(authority.regionId) ?? null : null,
      boundaryPolygon: authority.boundaryPolygon,
      projectCount,
      evidenceCount,
      verifiedEvidenceCount,
      staleProjectCount,
      latestEvidenceDate: latestEvidence ? latestEvidence.toISOString() : null,
      latestEvidenceAgeDays: daysAgo(latestEvidence),
      projectsWithCoordinates,
      mappingQuality,
      priority: computePriority(projectCount, staleProjectCount, mappingQuality),
      projects: projects
        .map((project) => ({
          id: project.id,
          title: project.title,
          status: project.status,
          latestEvidenceDate: latestEvidenceDateForProject(project)?.toISOString() ?? null,
          evidenceCount: project.evidence.length,
          hasCoordinates:
            toNumber(project.latitude) !== null && toNumber(project.longitude) !== null,
        }))
        .sort((left, right) => {
          const leftDate = left.latestEvidenceDate ? Date.parse(left.latestEvidenceDate) : 0;
          const rightDate = right.latestEvidenceDate ? Date.parse(right.latestEvidenceDate) : 0;
          return rightDate - leftDate;
        }),
    };
  });

  const summary = {
    authorityCount: rows.length,
    authoritiesWithoutProjects: rows.filter((row) => row.projectCount === 0).length,
    authoritiesWithStaleEvidence: rows.filter((row) => row.staleProjectCount > 0).length,
    authoritiesWithPoorMapping: rows.filter((row) => row.mappingQuality === 'POOR').length,
    unassignedProjectCount,
    generatedAt: new Date().toISOString(),
  };

  return {
    summary,
    rows,
  };
}
