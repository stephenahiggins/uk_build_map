import { PrismaClient } from "@prisma/client";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import { writeFileSync } from "fs";
import { join } from "path";

interface PrismaSeedProject {
  id: string;
  title: string;
  description: string;
  type: "LOCAL_GOV" | "NATIONAL_GOV" | "REGIONAL_GOV";
  regionId: string | null;
  localAuthorityId: string | null;
  createdById: number;
  expectedCompletion: string | null;
  status: "RED" | "AMBER" | "GREEN" | null;
  statusRationale: string | null;
  latitude: number | null;
  longitude: number | null;
  evidence: PrismaSeedEvidence[];
}

interface PrismaSeedEvidence {
  type: "PDF" | "URL" | "TEXT" | "DATE";
  title: string;
  url?: string;
  description?: string;
  datePublished?: string;
}

interface SqliteProject {
  id: string;
  title: string;
  description: string | null;
  type: string;
  regionId: string | null;
  localAuthorityId: string | null;
  createdById: number;
  expectedCompletion: string | null;
  status: string | null;
  statusRationale: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  createdAt: string;
  statusUpdatedAt: string;
}

interface SqliteEvidence {
  id: string;
  projectId: string;
  submittedById: number;
  type: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  datePublished: string | null;
  description: string | null;
  createdAt: string;
  moderationState: string;
}

/**
 * Convert SQLite database to Prisma seed format
 */
export async function convertSqliteToPrismaSeed(
  sqliteDbPath: string,
  outputPath: string = "prisma/seed-data.json"
) {
  try {
    console.log(`Opening SQLite database: ${sqliteDbPath}`);

    // Open SQLite database
    const db = await open({
      filename: sqliteDbPath,
      driver: sqlite3.Database,
    });

    // Fetch all projects
    const projects = await db.all<SqliteProject[]>(`
      SELECT * FROM Project ORDER BY createdAt DESC
    `);

    console.log(`Found ${projects.length} projects`);

    // Fetch all evidence items
    const evidenceItems = await db.all<SqliteEvidence[]>(`
      SELECT * FROM EvidenceItem ORDER BY createdAt DESC
    `);

    console.log(`Found ${evidenceItems.length} evidence items`);

    // Group evidence by project
    const evidenceByProject = new Map<string, SqliteEvidence[]>();
    for (const evidence of evidenceItems) {
      if (!evidenceByProject.has(evidence.projectId)) {
        evidenceByProject.set(evidence.projectId, []);
      }
      evidenceByProject.get(evidence.projectId)!.push(evidence);
    }

    // Convert to Prisma seed format
    const seedData: PrismaSeedProject[] = projects.map((project) => {
      const projectEvidence = evidenceByProject.get(project.id) || [];

      return {
        id: project.id,
        title: project.title,
        description: project.description || "",
        type: mapProjectType(project.type),
        regionId: project.regionId,
        localAuthorityId: project.localAuthorityId,
        createdById: project.createdById,
        expectedCompletion: project.expectedCompletion
          ? formatDate(project.expectedCompletion)
          : null,
        status: mapProjectStatus(project.status),
        statusRationale: project.statusRationale,
        latitude: project.latitude,
        longitude: project.longitude,
        evidence: projectEvidence.map((evidence) => ({
          type: mapEvidenceType(evidence.type),
          title: evidence.title,
          url: evidence.url || undefined,
          description: evidence.description || undefined,
          datePublished: evidence.datePublished ? formatDate(evidence.datePublished) : undefined,
        })),
      };
    });

    // Write to file
    const outputData = JSON.stringify(seedData, null, 2);
    writeFileSync(outputPath, outputData, "utf8");

    console.log(`Successfully converted ${projects.length} projects to Prisma seed format`);
    console.log(`Output written to: ${outputPath}`);

    await db.close();
    return seedData;
  } catch (error) {
    console.error("Error converting SQLite to Prisma seed:", error);
    throw error;
  }
}

/**
 * Map SQLite project type to Prisma enum
 */
function mapProjectType(sqliteType: string): "LOCAL_GOV" | "NATIONAL_GOV" | "REGIONAL_GOV" {
  switch (sqliteType.toUpperCase()) {
    case "LOCAL_GOV":
      return "LOCAL_GOV";
    case "NATIONAL_GOV":
      return "NATIONAL_GOV";
    case "REGIONAL_GOV":
      return "REGIONAL_GOV";
    default:
      console.warn(`Unknown project type: ${sqliteType}, defaulting to LOCAL_GOV`);
      return "LOCAL_GOV";
  }
}

/**
 * Map SQLite project status to Prisma enum
 */
function mapProjectStatus(sqliteStatus: string | null): "RED" | "AMBER" | "GREEN" | null {
  if (!sqliteStatus) return null;

  switch (sqliteStatus.toUpperCase()) {
    case "RED":
      return "RED";
    case "AMBER":
      return "AMBER";
    case "GREEN":
      return "GREEN";
    default:
      console.warn(`Unknown project status: ${sqliteStatus}, defaulting to null`);
      return null;
  }
}

/**
 * Map SQLite evidence type to Prisma enum
 */
function mapEvidenceType(sqliteType: string): "PDF" | "URL" | "TEXT" | "DATE" {
  switch (sqliteType.toUpperCase()) {
    case "PDF":
      return "PDF";
    case "URL":
      return "URL";
    case "TEXT":
      return "TEXT";
    case "DATE":
      return "DATE";
    default:
      console.warn(`Unknown evidence type: ${sqliteType}, defaulting to TEXT`);
      return "TEXT";
  }
}

/**
 * Format date string to ISO format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.warn(`Invalid date format: ${dateString}, returning as-is`);
    return dateString;
  }
}

/**
 * Create a Prisma seed file from the converted data
 */
export async function createPrismaSeedFile(
  seedData: PrismaSeedProject[],
  outputPath: string = "prisma/seed.ts"
) {
  const seedContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await prisma.evidenceItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.region.deleteMany();
  await prisma.localAuthority.deleteMany();

  // Create system user
  const systemUser = await prisma.user.create({
    data: {
      user_name: 'System User',
      user_email: 'system@lfg-agents.local',
      user_password: 'system-password-hash',
      type: 'ADMIN',
      user_active: true,
      user_deleted: false,
    },
  });

  console.log('Created system user:', systemUser.user_id);

  // Seed projects
  const projects = ${JSON.stringify(seedData, null, 2)};

  for (const projectData of projects) {
    console.log(\`Creating project: \${projectData.title}\`);
    
    const project = await prisma.project.create({
      data: {
        id: projectData.id,
        title: projectData.title,
        description: projectData.description,
        type: projectData.type,
        regionId: projectData.regionId,
        localAuthorityId: projectData.localAuthorityId,
        createdById: projectData.createdById,
        expectedCompletion: projectData.expectedCompletion ? new Date(projectData.expectedCompletion) : null,
        status: projectData.status || 'AMBER',
        statusRationale: projectData.statusRationale,
        latitude: projectData.latitude,
        longitude: projectData.longitude,
      },
    });

    // Create evidence items for this project
    for (const evidenceData of projectData.evidence) {
      await prisma.evidenceItem.create({
        data: {
          projectId: project.id,
          submittedById: projectData.createdById,
          type: evidenceData.type,
          title: evidenceData.title,
          url: evidenceData.url,
          description: evidenceData.description,
          datePublished: evidenceData.datePublished ? new Date(evidenceData.datePublished) : null,
          moderationState: 'APPROVED',
        },
      });
    }
  }

  console.log('Database seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
`;

  writeFileSync(outputPath, seedContent, "utf8");
  console.log(`Prisma seed file created: ${outputPath}`);
}

/**
 * CLI function to run the conversion
 */
export async function runConversion() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: npm run convert-sqlite <sqlite-db-path> [output-path]");
    console.log("Example: npm run convert-sqlite ./data.db ./prisma/seed-data.json");
    process.exit(1);
  }

  const sqlitePath = args[0];
  const outputPath = args[1] || "prisma/seed-data.json";

  try {
    const seedData = await convertSqliteToPrismaSeed(sqlitePath, outputPath);

    // Also create the Prisma seed file
    const seedFilePath = outputPath.replace(".json", ".ts");
    await createPrismaSeedFile(seedData, seedFilePath);

    console.log("Conversion completed successfully!");
  } catch (error) {
    console.error("Conversion failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runConversion();
}
