import 'dotenv/config';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { feature, point } from '@turf/helpers';
import { Prisma } from '@prisma/client';
import { createPrismaClient } from '../src/lib/createPrismaClient';
import { resolveDatabaseUrlForHostScripts } from './lib/resolveDatabaseUrlForHostScripts';

resolveDatabaseUrlForHostScripts();

type PolygonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: unknown;
};

type GeoJsonFeature = {
  type: 'Feature';
  geometry: PolygonGeometry;
  properties: Record<string, unknown>;
};

let prisma: ReturnType<typeof createPrismaClient> | null = null;

const getPrisma = () => {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
};

const REGION_LAYER_URL =
  'https://services1.arcgis.com/ESMARspQHYMw9BZ9/ArcGIS/rest/services/Regions_December_2022_EN_BGC/FeatureServer/0';
const LAD_LAYER_URL =
  'https://services1.arcgis.com/ESMARspQHYMw9BZ9/ArcGIS/rest/services/Local_Authority_Districts_December_2023_Boundaries_UK_BFC/FeatureServer/0';

// Smaller pages reduce ArcGIS gateway timeouts on heavy LAD geometry responses.
const PAGE_SIZE = 500;

async function fetchWithRetry(url: string, maxAttempts = 6): Promise<Response> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      const retryable = [429, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === maxAttempts) return response;
      const delayMs = Math.min(60_000, 4000 * 2 ** (attempt - 1));
      console.warn(
        `HTTP ${response.status} from ArcGIS; retry ${attempt}/${maxAttempts} in ${delayMs / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delayMs = Math.min(60_000, 4000 * 2 ** (attempt - 1));
      console.warn(
        `ArcGIS fetch error (${(err as Error).message}); retry ${attempt}/${maxAttempts} in ${delayMs / 1000}s...`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('fetchWithRetry: exhausted retries');
}

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const isPolygonGeometry = (value: unknown): value is PolygonGeometry => {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: string }).type;
  return type === 'Polygon' || type === 'MultiPolygon';
};

/** Mean coordinate across all rings (avoids @turf/center-of-mass → ESM concaveman chain under ts-node). */
function representativePoint(geometry: PolygonGeometry) {
  let sumX = 0;
  let sumY = 0;
  let n = 0;
  const addRing = (ring: unknown) => {
    if (!Array.isArray(ring)) return;
    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        sumX += Number(coord[0]);
        sumY += Number(coord[1]);
        n += 1;
      }
    }
  };
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates as unknown[]) addRing(ring);
  } else {
    for (const poly of geometry.coordinates as unknown[][]) {
      for (const ring of poly) addRing(ring);
    }
  }
  if (n === 0) return point([0, 0]);
  return point([sumX / n, sumY / n]);
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

type ArcGisFetchOptions = {
  /** Decimal degrees when outSR=4326; reduces payload / timeouts on detailed LAD polygons. */
  maxAllowableOffset?: number;
  pageSize?: number;
};

async function fetchArcGisFeatures(
  layerUrl: string,
  outFields: string,
  options?: ArcGisFetchOptions
): Promise<GeoJsonFeature[]> {
  const pageSize = options?.pageSize ?? PAGE_SIZE;
  const features: GeoJsonFeature[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${layerUrl}/query`);
    url.searchParams.set('where', '1=1');
    url.searchParams.set('outFields', outFields);
    url.searchParams.set('returnGeometry', 'true');
    url.searchParams.set('outSR', '4326');
    url.searchParams.set('f', 'geojson');
    url.searchParams.set('resultOffset', offset.toString());
    url.searchParams.set('resultRecordCount', pageSize.toString());
    if (options?.maxAllowableOffset != null) {
      url.searchParams.set(
        'maxAllowableOffset',
        String(options.maxAllowableOffset)
      );
    }

    const pageUrl = url.toString();
    let batch: GeoJsonFeature[] = [];
    const maxPageAttempts = 5;
    for (let pageAttempt = 1; pageAttempt <= maxPageAttempts; pageAttempt++) {
      try {
        const response = await fetchWithRetry(pageUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch features (${response.status} ${response.statusText})`
          );
        }
        const payload = (await response.json()) as {
          features?: GeoJsonFeature[];
        };
        batch = payload.features ?? [];
        break;
      } catch (err) {
        if (pageAttempt === maxPageAttempts) throw err;
        const delayMs = 8000 * pageAttempt;
        console.warn(
          `ArcGIS page read failed (${(err as Error).message}); retry ${pageAttempt}/${maxPageAttempts} in ${delayMs / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    features.push(...batch);
    if (batch.length < pageSize) break;
    offset += batch.length;
  }

  return features;
}

async function syncRegionBoundaries() {
  console.log('Fetching region boundaries...');
  const regionFeatures = await fetchArcGisFeatures(
    REGION_LAYER_URL,
    'RGN22CD,RGN22NM'
  );

  const regions = await getPrisma().region.findMany({
    select: { id: true, name: true },
  });
  const regionByName = new Map<string, string>();
  regions.forEach((region) => {
    regionByName.set(normalizeName(region.name), region.id);
  });

  let updated = 0;
  let skipped = 0;

  for (const featureItem of regionFeatures) {
    const name = featureItem.properties?.RGN22NM;
    if (typeof name !== 'string') {
      skipped += 1;
      continue;
    }

    const regionId = regionByName.get(normalizeName(name));
    if (!regionId || !isPolygonGeometry(featureItem.geometry)) {
      skipped += 1;
      continue;
    }

    await getPrisma().region.update({
      where: { id: regionId },
      data: { boundingPolygon: featureItem.geometry },
    });
    updated += 1;
  }

  console.log(`Regions updated: ${updated}, skipped: ${skipped}`);
}

async function syncLocalAuthorityBoundaries() {
  console.log('Fetching local authority boundaries...');
  const ladFeatures = await fetchArcGisFeatures(LAD_LAYER_URL, 'LAD23CD,LAD23NM', {
    maxAllowableOffset: 0.002,
    pageSize: 200,
  });

  const authorities = await getPrisma().localAuthority.findMany({
    select: { id: true, code: true },
  });
  const authorityByCode = new Map<string, string>();
  authorities.forEach((authority) => {
    authorityByCode.set(authority.code.trim(), authority.id);
  });

  let updated = 0;
  let skipped = 0;

  for (const featureItem of ladFeatures) {
    const code = featureItem.properties?.LAD23CD;
    if (typeof code !== 'string') {
      skipped += 1;
      continue;
    }

    const authorityId = authorityByCode.get(code.trim());
    if (!authorityId || !isPolygonGeometry(featureItem.geometry)) {
      skipped += 1;
      continue;
    }

    await getPrisma().localAuthority.update({
      where: { id: authorityId },
      data: { boundaryPolygon: featureItem.geometry },
    });
    updated += 1;
  }

  console.log(`Local authorities updated: ${updated}, skipped: ${skipped}`);
}

async function mapLocalAuthoritiesToRegions() {
  console.log('Assigning regions for local authorities...');
  const [regions, localAuthorities] = await Promise.all([
    getPrisma().region.findMany({
      select: { id: true, name: true, boundingPolygon: true },
      where: { boundingPolygon: { not: Prisma.AnyNull } },
    }),
    getPrisma().localAuthority.findMany({
      select: { id: true, regionId: true, boundaryPolygon: true },
      where: { boundaryPolygon: { not: Prisma.AnyNull } },
    }),
  ]);

  const regionFeatures = regions
    .map((region) =>
      isPolygonGeometry(region.boundingPolygon)
        ? { id: region.id, geometry: region.boundingPolygon }
        : null
    )
    .filter((value): value is { id: string; geometry: PolygonGeometry } => !!value);

  const fallbackRegionIds = new Set(
    (
      await getPrisma().region.findMany({
        where: {
          name: {
            in: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Unassigned'],
          },
        },
        select: { id: true },
      })
    ).map((region) => region.id)
  );
  let updated = 0;
  let skipped = 0;

  for (const authority of localAuthorities) {
    if (!isPolygonGeometry(authority.boundaryPolygon)) {
      skipped += 1;
      continue;
    }

    if (authority.regionId && !fallbackRegionIds.has(authority.regionId)) {
      skipped += 1;
      continue;
    }

    const authorityPoint = representativePoint(authority.boundaryPolygon);
    let matchedRegionId: string | null = null;

    for (const region of regionFeatures) {
      if (booleanPointInPolygon(authorityPoint, feature(region.geometry) as any)) {
        matchedRegionId = region.id;
        break;
      }
    }

    if (!matchedRegionId) {
      skipped += 1;
      continue;
    }

    await getPrisma().localAuthority.update({
      where: { id: authority.id },
      data: { regionId: matchedRegionId },
    });
    updated += 1;
  }

  console.log(
    `Local authorities assigned to regions: ${updated}, skipped: ${skipped}`
  );
}

async function assignProjectsToBoundaries() {
  console.log('Assigning projects to region/local authority...');
  const [regions, localAuthorities, projects] = await Promise.all([
    getPrisma().region.findMany({
      select: { id: true, boundingPolygon: true },
      where: { boundingPolygon: { not: Prisma.AnyNull } },
    }),
    getPrisma().localAuthority.findMany({
      select: { id: true, regionId: true, boundaryPolygon: true },
      where: { boundaryPolygon: { not: Prisma.AnyNull } },
    }),
    getPrisma().project.findMany({
      select: {
        id: true,
        regionId: true,
        localAuthorityId: true,
        latitude: true,
        longitude: true,
      },
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
    }),
  ]);

  const regionFeatures = regions
    .map((region) =>
      isPolygonGeometry(region.boundingPolygon)
        ? { id: region.id, geometry: region.boundingPolygon }
        : null
    )
    .filter((value): value is { id: string; geometry: PolygonGeometry } => !!value);

  const authorityFeatures = localAuthorities
    .map((authority) =>
      isPolygonGeometry(authority.boundaryPolygon)
        ? {
            id: authority.id,
            regionId: authority.regionId ?? null,
            geometry: authority.boundaryPolygon,
          }
        : null
    )
    .filter(
      (value): value is {
        id: string;
        regionId: string | null;
        geometry: PolygonGeometry;
      } => !!value
    );

  let updated = 0;
  let skipped = 0;

  for (const project of projects) {
    const latitude = toNumber(project.latitude);
    const longitude = toNumber(project.longitude);
    if (latitude === null || longitude === null) {
      skipped += 1;
      continue;
    }

    const projectPoint = point([longitude, latitude]);
    let matchedAuthority:
      | { id: string; regionId: string | null }
      | null = null;

    for (const authority of authorityFeatures) {
      if (booleanPointInPolygon(projectPoint, feature(authority.geometry) as any)) {
        matchedAuthority = { id: authority.id, regionId: authority.regionId };
        break;
      }
    }

    let matchedRegionId: string | null = matchedAuthority?.regionId ?? null;
    if (!matchedRegionId) {
      for (const region of regionFeatures) {
        if (booleanPointInPolygon(projectPoint, feature(region.geometry) as any)) {
          matchedRegionId = region.id;
          break;
        }
      }
    }

    if (!matchedAuthority && !matchedRegionId) {
      skipped += 1;
      continue;
    }

    const nextRegionId = matchedRegionId ?? project.regionId ?? null;
    const nextAuthorityId = matchedAuthority?.id ?? project.localAuthorityId ?? null;

    if (
      nextRegionId === project.regionId &&
      nextAuthorityId === project.localAuthorityId
    ) {
      skipped += 1;
      continue;
    }

    await getPrisma().project.update({
      where: { id: project.id },
      data: {
        regionId: nextRegionId,
        localAuthorityId: nextAuthorityId,
      },
    });
    updated += 1;
  }

  console.log(`Projects updated: ${updated}, skipped: ${skipped}`);
}

async function main() {
  getPrisma();

  const args = new Set(process.argv.slice(2));
  const boundariesOnly = args.has('--boundaries-only');
  const projectsOnly = args.has('--projects-only');

  if (!projectsOnly) {
    await syncRegionBoundaries();
    await syncLocalAuthorityBoundaries();
    await mapLocalAuthoritiesToRegions();
  }

  if (!boundariesOnly) {
    await assignProjectsToBoundaries();
  }
}

main()
  .catch((error) => {
    console.error('Geo boundary sync failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
