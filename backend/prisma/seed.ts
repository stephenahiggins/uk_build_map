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
  const response = await fetch(LAD_TO_REGION_CSV);
  const csvText = await response.text();

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
