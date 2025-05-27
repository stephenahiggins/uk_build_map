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
        url: 'https://www.hs2.org.uk/',
        description: 'Official information and updates on HS2.',
        moderationState: 'APPROVED',
        latitude: 51.5074,
        longitude: -0.1278,
        datePublished: new Date('2025-05-27'),
      },
      {
        id: 'evi-crossrail-1',
        projectId: crossrail.id,
        submittedById: normalUser?.user_id ?? 2,
        type: 'PDF',
        title: 'Crossrail Completion Report',
        url: 'https://content.tfl.gov.uk/evidencing-the-value-of-the-elizabeth-line.pdf',
        description: 'Final project report for the Elizabeth Line.',
        moderationState: 'APPROVED',
        latitude: 51.5154,
        longitude: -0.0721,
        datePublished: new Date('2024-05-01'),
      },
      {
        id: 'evi-tideway-1',
        projectId: tideway.id,
        submittedById: adminUser?.user_id ?? 1,
        type: 'TEXT',
        title: 'Tideway Construction Update',
        summary:
          'Construction is progressing with some delays due to supply chain issues.',
        description: 'Update as of May 2025.',
        moderationState: 'APPROVED',
        latitude: 51.5079,
        longitude: -0.0877,
        datePublished: new Date('2025-05-15'),
      },
      {
        projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
        title: 'Elland Rail Station project takes another step forward',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Calderdale Council News',
        datePublished: new Date('2024-09-05'),
        url: 'https://news.calderdale.gov.uk/10618-2/',
        summary:
          'Progress on the new Elland Rail Station has taken a major step forward after a contractor was appointed to finalize the project’s detailed design. On-site surveys are underway and a full business case will follow by mid-2025, paving the way for final approval and the start of construction:contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}.',
      },
      {
        projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
        title:
          'Elland Rail Station Moves Forward: West Yorkshire’s £25m Transport Boost on Track',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'BDC Magazine',
        datePublished: new Date('2024-01-03'),
        url: 'https://bdcmagazine.com/2024/01/elland-rail-station-moves-forward-west-yorkshires-25m-transport-boost-on-track/',
        summary:
          'Plans for the new £25 million Elland Rail Station are making significant progress, with completion now projected for late 2026. Contractor Keltbray is aiming to finish the final design stage by summer 2024, after which the West Yorkshire Combined Authority will review the full business case to move the project into the construction phase:contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}.',
      },
      {
        projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
        title: 'New train station moves a step closer',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'BBC News (LDRS)',
        datePublished: new Date('2024-09-06'),
        url: 'https://www.bbc.com/news/articles/cred40g5v2qo',
        summary:
          'A contractor has been appointed to oversee the final development stages of Elland’s new railway station, which will be added to the Calder Valley Line and is now expected to open in 2026. Keltbray Infrastructure Services will complete detailed design work by next summer, after which the project can proceed to final approval and then construction, according to local officials:contentReference[oaicite:4]{index=4}:contentReference[oaicite:5]{index=5}.',
      },

      // Evidence for Huddersfield Southern Gateway (A62 Smart Corridor)
      {
        projectId: 'ba960bd7-94cd-40fa-9ed1-7fd970270084',
        title:
          'On the right track: A62 Leeds Road Smart Corridor making progress and tipped to deliver on time',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Kirklees Council News',
        datePublished: new Date('2022-11-22'),
        url: 'https://kirkleestogether.co.uk/2022/11/22/on-the-right-track-a62-leeds-road-smart-corridor-making-progress-and-tipped-deliver-on-time/',
        summary:
          'Kirklees Council reported that construction on the A62 Leeds Road “Smart Corridor” was progressing well in late 2022, with the main works on track to be completed by spring 2023:contentReference[oaicite:6]{index=6}:contentReference[oaicite:7]{index=7}. The scheme – part of West Yorkshire’s Corridor Improvement Programme – is designed to cut congestion and improve journey times with new bus lanes, cycle facilities and junction upgrades along the route.',
      },
      {
        projectId: 'ba960bd7-94cd-40fa-9ed1-7fd970270084',
        title:
          'Brand new £8m Yorkshire road dug up weeks later due to gas leak',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Yorkshire Post',
        datePublished: new Date('2023-06-02'),
        url: 'https://www.yorkshirepost.co.uk/news/transport/brand-new-ps8m-yorkshire-road-dug-up-weeks-later-due-to-gas-leak-4166980',
        summary:
          'The £7.9 million A62 Leeds Road Smart Corridor scheme in Huddersfield reached completion in mid-April 2023:contentReference[oaicite:8]{index=8}, delivering major highway upgrades to tackle congestion and improve travel times and safety on this key route. (The project’s final resurfacing was finished in April, slightly later than originally planned due to earlier schedule adjustments and supply challenges.):contentReference[oaicite:9]{index=9}',
      },
      {
        projectId: 'ba960bd7-94cd-40fa-9ed1-7fd970270084',
        title:
          'Updates to schedule of upcoming A62 improvements will mean less disruption for residents and businesses',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Kirklees Council News',
        datePublished: new Date('2022-04-01'),
        url: 'https://kirkleestogether.co.uk/2022/04/01/updates-to-schedule-of-upcoming-a62-improvements-will-mean-less-disruption-for-residents-and-businesses/',
        summary:
          'In 2022, the council revised the construction schedule for the A62 Smart Corridor project to accelerate works and reduce disruption. An intensified seven-week closure at a key junction was implemented so that overall roadworks could finish by early December 2022 – about two months sooner than originally planned:contentReference[oaicite:10]{index=10}. (Subsequent updates indicated the project’s final completion date slipped into spring 2023, partly due to challenges in obtaining new traffic signal equipment.)',
      },

      // Evidence for City Park Affordable Housing Phase 1
      {
        projectId: '11997b78-6302-454d-aa97-e2842473eb09',
        title:
          'Aire Park Leeds: Housing developer found for “prime plot” on Meadow Lane in the city centre',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Yorkshire Evening Post',
        datePublished: new Date('2024-05-24'),
        url: 'https://www.yorkshireeveningpost.co.uk/news/politics/council/aire-park-leeds-housing-developer-found-for-prime-plot-on-meadow-lane-in-the-city-centre-4639900',
        summary:
          'Leeds City Council has chosen developer Glenbrook as the preferred bidder for a prime 0.18-hectare plot at Meadow Lane, adjacent to the new City Park (Aire Park) in the South Bank:contentReference[oaicite:11]{index=11}. Glenbrook is expected to seek planning permission to deliver a high-quality residential development of around 350 apartments on the site, with a significant proportion of the homes designated as affordable housing:contentReference[oaicite:12]{index=12}.',
      },
      {
        projectId: '11997b78-6302-454d-aa97-e2842473eb09',
        title: '£50m secured for Leeds South Bank apartment scheme',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Business Link Magazine',
        datePublished: new Date('2025-05-21'),
        url: 'https://www.blmforum.net/mag/50m-secured-for-leeds-south-bank-apartment-scheme/',
        summary:
          'A major housing development in Leeds’s South Bank has secured a £50 million loan from Homes England, enabling construction of 375 apartments across two towers on Water Lane:contentReference[oaicite:13]{index=13}. The project, which also received £4.4 million from West Yorkshire’s Brownfield Housing Fund, commenced building work in May 2024 and is scheduled to complete by early 2027:contentReference[oaicite:14]{index=14}. The scheme supports regional goals for affordable, sustainable homes on brownfield land through a partnership of public and private investment.',
      },

      // Evidence for Brighouse Town Deal – Canalside & Market Hub
      {
        projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
        title: 'On the move – Brighouse’s market prepares for temporary home',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Calderdale Council News',
        datePublished: new Date('2024-08-21'),
        url: 'https://news.calderdale.gov.uk/on-the-move-brighouses-market-prepares-for-temporary-home/',
        summary:
          'Brighouse Open Market is relocating to a temporary site this autumn so that work can begin on constructing its new permanent market hall on the canalside as part of the £19.1 million Town Deal:contentReference[oaicite:15]{index=15}:contentReference[oaicite:16]{index=16}. After planning permission was secured in March 2024, Triton Construction was appointed as contractor for the market redevelopment, with the main construction phase set to start by late September 2024 and last around 12 months:contentReference[oaicite:17]{index=17}:contentReference[oaicite:18]{index=18}.',
      },
      {
        projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
        title:
          'Milestone moment for Brighouse as Town Deal market transformation begins',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Calderdale Next Chapter News',
        datePublished: new Date('2024-10-30'),
        url: 'https://www.calderdalenextchapter.co.uk/news/milestone-moment-brighouse-town-deal-market-transformation-begins',
        summary:
          'By late 2024, construction was underway on Brighouse’s Town Deal projects to revitalize the waterfront and market area. Demolition of the old canalside market building began in October, and West Yorkshire-based Triton Construction has been tasked with building the new covered market hall as a focal point for the town’s regeneration:contentReference[oaicite:19]{index=19}:contentReference[oaicite:20]{index=20}.',
      },
      {
        projectId: 'fccb723d-b3b7-495a-a005-735092cc48d4',
        title:
          'Brighouse Town Deal: Progress made on £19.1 million Government-funded projects in 2024 including Brighouse Market',
        submittedById: adminUser?.user_id ?? 1,
        type: 'URL',
        source: 'Halifax Courier',
        datePublished: new Date('2024-12-29'),
        url: 'https://www.halifaxcourier.co.uk/heritage-and-retro/heritage/brighouse-town-deal-progress-made-on-ps191-million-government-funded-projects-in-2024-including-brighouse-market-4913547',
        summary:
          'According to a year-end 2024 update, Brighouse’s Town Deal scheme has reached key milestones in both the market and public realm projects. The old market site was cleared and construction of a modern market hall (with 21 fixed stalls and improved facilities) is in progress, on track for completion in late 2025:contentReference[oaicite:21]{index=21}. Meanwhile, £6 million of the Town Deal is dedicated to Canalside and Thornton Square improvements – creating a new waterfront public space and enhancing the town centre’s image to encourage recreation and community gatherings:contentReference[oaicite:22]{index=22}.',
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
