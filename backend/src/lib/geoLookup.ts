import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { feature, point } from '@turf/helpers';
import { Prisma } from '@prisma/client';
import prisma from '../db';

type PolygonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: unknown;
};

type RegionBoundary = {
  id: string;
  name: string;
  geometry: PolygonGeometry;
};

type LocalAuthorityBoundary = {
  id: string;
  code: string;
  regionId: string;
  geometry: PolygonGeometry;
};

type BoundaryCache = {
  regions: RegionBoundary[];
  localAuthorities: LocalAuthorityBoundary[];
  loadedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let boundaryCache: BoundaryCache | null = null;

const isPolygonGeometry = (value: unknown): value is PolygonGeometry => {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: string }).type;
  return type === 'Polygon' || type === 'MultiPolygon';
};

async function loadBoundaryCache(): Promise<BoundaryCache> {
  const [regions, localAuthorities] = await Promise.all([
    prisma.region.findMany({
      select: { id: true, name: true, boundingPolygon: true },
      where: { boundingPolygon: { not: Prisma.AnyNull } },
    }),
    prisma.localAuthority.findMany({
      select: {
        id: true,
        code: true,
        regionId: true,
        boundaryPolygon: true,
      },
      where: { boundaryPolygon: { not: Prisma.AnyNull } },
    }),
  ]);

  const regionBoundaries: RegionBoundary[] = [];
  for (const region of regions) {
    if (!isPolygonGeometry(region.boundingPolygon)) continue;
    regionBoundaries.push({
      id: region.id,
      name: region.name,
      geometry: region.boundingPolygon,
    });
  }

  const localAuthorityBoundaries: LocalAuthorityBoundary[] = [];
  for (const authority of localAuthorities) {
    if (!isPolygonGeometry(authority.boundaryPolygon)) continue;
    localAuthorityBoundaries.push({
      id: authority.id,
      code: authority.code,
      regionId: authority.regionId,
      geometry: authority.boundaryPolygon,
    });
  }

  return {
    regions: regionBoundaries,
    localAuthorities: localAuthorityBoundaries,
    loadedAt: Date.now(),
  };
}

async function getBoundaryCache(): Promise<BoundaryCache> {
  if (!boundaryCache || Date.now() - boundaryCache.loadedAt > CACHE_TTL_MS) {
    boundaryCache = await loadBoundaryCache();
  }
  return boundaryCache;
}

function findRegionForPoint(
  longitude: number,
  latitude: number,
  regions: RegionBoundary[]
): RegionBoundary | null {
  const pt = point([longitude, latitude]);
  for (const region of regions) {
    if (booleanPointInPolygon(pt, feature(region.geometry) as any)) {
      return region;
    }
  }
  return null;
}

function findLocalAuthorityForPoint(
  longitude: number,
  latitude: number,
  localAuthorities: LocalAuthorityBoundary[]
): LocalAuthorityBoundary | null {
  const pt = point([longitude, latitude]);
  for (const authority of localAuthorities) {
    if (booleanPointInPolygon(pt, feature(authority.geometry) as any)) {
      return authority;
    }
  }
  return null;
}

export async function resolveGeoAssignments(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): Promise<{ regionId?: string; localAuthorityId?: string }> {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return {};
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return {};
  }

  const { regions, localAuthorities } = await getBoundaryCache();
  if (!regions.length && !localAuthorities.length) return {};

  const authority = findLocalAuthorityForPoint(
    longitude,
    latitude,
    localAuthorities
  );
  if (authority) {
    if (authority.regionId) {
      return { localAuthorityId: authority.id, regionId: authority.regionId };
    }
    const region = findRegionForPoint(longitude, latitude, regions);
    return {
      localAuthorityId: authority.id,
      regionId: region?.id,
    };
  }

  const region = findRegionForPoint(longitude, latitude, regions);
  if (!region) return {};

  return { regionId: region.id };
}
