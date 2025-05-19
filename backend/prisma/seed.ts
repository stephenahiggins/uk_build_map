import { PrismaClient, CountryCode, UserType } from '@prisma/client';
import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const LAD_TO_REGION_CSV =
  'https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/3959874c514b470e9dd160acdc00c97a/csv?layers=0';

async function main() {
  // --- Seed users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const admin_user = await prisma.user.upsert({
    where: { user_email: 'admin@example.com' },
    update: {},
    create: {
      user_name: 'Admin',
      user_email: 'admin@example.com',
      user_password: hashedPassword,
      type: UserType.ADMIN,
    },
  });
  console.log('Seeded admin user:', admin_user.user_email);

  const user = await prisma.user.upsert({
    where: { user_email: 'user@example.com' },
    update: {},
    create: {
      user_name: 'User',
      user_email: 'user@example.com',
      user_password: hashedPassword,
      type: UserType.USER,
    },
  });
  console.log('Seeded user:', user.user_email);

  const moderator = await prisma.user.upsert({
    where: { user_email: 'moderator@example.com' },
    update: {},
    create: {
      user_name: 'Moderator',
      user_email: 'moderator@example.com',
      user_password: hashedPassword,
      type: UserType.MODERATOR,
    },
  });
  console.log('Seeded moderator:', moderator.user_email);

  // --- Seed English Regions ---
  const regionsData = [
    { name: 'North East' },
    { name: 'North West' },
    { name: 'Yorkshire and the Humber' },
    { name: 'East Midlands' },
    { name: 'West Midlands' },
    { name: 'East of England' },
    { name: 'London' },
    { name: 'South East' },
    { name: 'South West' },
  ];

  const regionRecords: { [key: string]: string } = {};
  for (const region of regionsData) {
    const rec = await prisma.region.upsert({
      where: { name: region.name },
      update: {},
      create: { name: region.name },
    });
    regionRecords[region.name.trim().toLowerCase()] = rec.id;
  }
  console.log('Seeded regions:', Object.keys(regionRecords).length);

  // --- Download and parse LAD to region CSV ---
  console.log('Fetching English local authorities from ONS CSV...');

  let response = undefined;
  try {
    response = await fetch(LAD_TO_REGION_CSV);
  } catch (e) {
    console.log(e);
    return;
  }

  const csvText = (await response.text()) ?? '';
  type LadRow = {
    LAD24CD: string;
    LAD24NM: string;
    RGN24NM: string;
  };

  const rows: LadRow[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  let seededCount = 0;
  let skippedCount = 0;

  // ===== SEED PROJECTS & EVIDENCE =====
  // Fetch region and local authority for linking
  const region = await prisma.region.findFirst({
    where: { name: { contains: 'London' } },
  });
  const localAuthority = await prisma.localAuthority.findFirst({
    where: { name: { contains: 'Westminster' } },
  });

  // Use seeded users
  const adminUser = await prisma.user.findUnique({
    where: { user_email: 'admin@example.com' },
  });
  const normalUser = await prisma.user.findUnique({
    where: { user_email: 'user@example.com' },
  });

  // Seed some UK infrastructure projects
  const hs2 = await prisma.project.upsert({
    where: { id: 'hs2-proj-id' },
    update: {},
    create: {
      id: 'hs2-proj-id',
      title: 'HS2 High Speed Rail',
      description:
        'High Speed 2 (HS2) is a high-speed railway under construction in the UK, linking London, Birmingham, Manchester and Leeds.',
      type: 'NATIONAL_GOV',
      regionId: region?.id ?? '',
      localAuthorityId: localAuthority?.id ?? null,
      createdById: adminUser?.user_id ?? 1,
      expectedCompletion: new Date('2035-12-31T00:00:00Z'),
      status: 'AMBER',
      statusRationale: 'Delays due to funding and planning changes.',
      latitude: 51.5074,
      longitude: -0.1278,
    },
  });
  const crossrail = await prisma.project.upsert({
    where: { id: 'crossrail-proj-id' },
    update: {},
    create: {
      id: 'crossrail-proj-id',
      title: 'Crossrail (Elizabeth Line)',
      description:
        'A major new railway for London and the South East, running from Reading and Heathrow through central tunnels across to Shenfield and Abbey Wood.',
      type: 'REGIONAL_GOV',
      regionId: region?.id ?? '',
      localAuthorityId: localAuthority?.id ?? null,
      createdById: normalUser?.user_id ?? 2,
      expectedCompletion: new Date('2022-05-24T00:00:00Z'),
      status: 'GREEN',
      statusRationale: 'Operational as of May 2022.',
      latitude: 51.5154,
      longitude: -0.0721,
    },
  });
  const tideway = await prisma.project.upsert({
    where: { id: 'tideway-proj-id' },
    update: {},
    create: {
      id: 'tideway-proj-id',
      title: 'Thames Tideway Tunnel',
      description:
        'A major new sewer, urgently needed to protect the tidal River Thames from increasing sewage pollution.',
      type: 'LOCAL_GOV',
      regionId: region?.id ?? '',
      localAuthorityId: localAuthority?.id ?? null,
      createdById: adminUser?.user_id ?? 1,
      expectedCompletion: new Date('2025-12-31T00:00:00Z'),
      status: 'AMBER',
      statusRationale: 'Construction ongoing. Some delays reported.',
      latitude: 51.5079,
      longitude: -0.0877,
    },
  });

  // Seed evidence for these projects
  await prisma.evidenceItem.createMany({
    data: [
      {
        id: 'evi-hs2-1',
        projectId: hs2.id,
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        title: 'HS2 Official Website',
        urlOrBlobId: 'https://www.hs2.org.uk/',
        description: 'Official information and updates on HS2.',
        moderationState: 'APPROVED',
        latitude: 51.5074,
        longitude: -0.1278,
      },
      {
        id: 'evi-crossrail-1',
        projectId: crossrail.id,
        submittedById: normalUser?.user_id ?? 2,
        type: 'PDF',
        title: 'Crossrail Completion Report',
        urlOrBlobId: 'crossrail-report.pdf',
        description: 'Final project report for the Elizabeth Line.',
        moderationState: 'APPROVED',
        latitude: 51.5154,
        longitude: -0.0721,
      },
      {
        id: 'evi-tideway-1',
        projectId: tideway.id,
        submittedById: adminUser?.user_id ?? 1,
        type: 'TEXT',
        title: 'Tideway Construction Update',
        urlOrBlobId:
          'Construction is progressing with some delays due to supply chain issues.',
        description: 'Update as of May 2025.',
        moderationState: 'PENDING',
        latitude: 51.5079,
        longitude: -0.0877,
      },
    ],
    skipDuplicates: true,
  });

  // Sanitize keys to remove BOM/hidden characters from CSV headers
  const cleanRows = rows.map((row) => {
    const newRow: any = {};
    Object.keys(row).forEach((key) => {
      const cleanKey = key.replace(/^\uFEFF/, '');
      newRow[cleanKey] = (row as Record<string, any>)[key];
    });
    return newRow;
  });

  for (const row of cleanRows) {
    const code = row['LAD24CD']?.trim();
    const name = row.LAD24NM?.trim();
    const regionName = row.RGN24NM?.trim();
    const regionKey = regionName?.toLowerCase();

    if (!code || !name || !regionKey) {
      skippedCount++;
      continue;
    }

    await prisma.localAuthority.upsert({
      where: { code },
      update: {},
      create: {
        name,
        code,
        regionId: regionRecords[regionKey],
        countryCode: CountryCode.ENGLAND,
      },
    });

    seededCount++;
  }

  console.log(`✅ Seeded ${seededCount} local authorities.`);
  console.log(`⚠️ Skipped ${skippedCount} due to missing or unmatched data.`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
