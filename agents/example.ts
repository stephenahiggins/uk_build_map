import {
  gatherEvidenceWithGemini,
  searchInfrastructureProjects,
  processEvidenceWithLocation,
  findOrCreateRegion,
  findOrCreateLocalAuthority,
  ENGLISH_REGIONS,
  normalizeRegion,
  getLocalAuthorityCoordinates,
  getRegionForAuthority,
  validateEvidenceDate,
  extractEvidenceDate,
  processEvidenceWithDateTimeValidation,
  createProjectWithEvidence,
  findOrCreateSystemUser,
} from "./src/geminiService";
import { evaluateProjectWithGemini } from "../shared/projectEvaluation";
import {
  initializeDatabase,
  createProject,
  getProject,
  getProjects,
  addEvidenceToProject,
  getProjectStatistics,
  getRegions,
  getLocalAuthorities,
} from "./src/dbOperations";
import { PrismaClient } from "@prisma/client";

// Example usage of the enhanced evidence gathering system
async function exampleEvidenceGathering() {
  console.log("=== Enhanced Evidence Gathering Example ===\n");

  // 1. Search for infrastructure projects with geographic data
  console.log("1. Searching for infrastructure projects in West Yorkshire...");
  const searchResults = await searchInfrastructureProjects("West Yorkshire", 5);

  console.log(`Found ${searchResults.projects.length} projects:`);
  searchResults.projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.title}`);
    console.log(`   Status: ${project.status}`);
    console.log(`   Location: ${project.latitude}, ${project.longitude}`);
    console.log(`   Authority: ${project.localAuthority}`);
    console.log(`   Region: ${project.region}`);
    console.log("");
  });

  // 2. Gather evidence for a specific project with geographic data
  console.log("2. Gathering evidence for Transpennine Route Upgrade...");
  const evidenceResults = await gatherEvidenceWithGemini(
    "Transpennine Route Upgrade (TRU)",
    "A multi-billion-pound programme to upgrade the railway line between Manchester, Leeds, and York",
    "West Yorkshire",
    15 // Request 15 pieces of evidence
  );

  console.log(`Gathered ${evidenceResults.evidence.length} evidence items:`);
  evidenceResults.evidence.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   Date: ${item.evidenceDate}`);
    console.log(`   Authority: ${item.localAuthority}`);
    console.log(`   Region: ${item.region}`);
    console.log("");
  });

  const evaluation = await evaluateProjectWithGemini({
    projectName: "Transpennine Route Upgrade (TRU)",
    projectDescription:
      "A multi-billion-pound programme to upgrade the railway line between Manchester, Leeds, and York",
    locale: "West Yorkshire",
    evidence: evidenceResults.evidence.map((item) => ({
      title: item.title,
      summary: item.summary,
      source: item.source,
      sourceUrl: item.sourceUrl,
      evidenceDate: item.evidenceDate,
      rawText: item.rawText,
    })),
  });

  console.log("Gemini evaluation summary:");
  console.log(`   Status: ${evaluation.ragStatus}`);
  console.log(`   Rationale: ${evaluation.ragRationale}`);
  if (evaluation.latitude != null && evaluation.longitude != null) {
    console.log(
      `   Coordinates: ${evaluation.latitude}, ${evaluation.longitude}${
        evaluation.locationDescription ? ` (${evaluation.locationDescription})` : ""
      }`
    );
  } else {
    console.log("   Coordinates: Unresolved");
  }
  console.log(`   Source: ${evaluation.locationSource || "Unknown"}`);
  console.log(`   Confidence: ${evaluation.locationConfidence}`);
  console.log("");

  // 3. Example of using helper functions
  console.log("3. Using helper functions...");

  // Validate region names
  const testRegions = ["Yorkshire and the Humber", "North West", "Invalid Region"];
  testRegions.forEach((region) => {
    const normalized = normalizeRegion(region);
    console.log(`Region "${region}" -> "${normalized}"`);
  });

  // Get coordinates for local authorities
  const testAuthorities = ["Leeds City Council", "Bradford Council", "Unknown Council"];
  testAuthorities.forEach((authority) => {
    const coords = getLocalAuthorityCoordinates(authority);
    const region = getRegionForAuthority(authority);
    console.log(
      `Authority "${authority}" -> Coords: ${
        coords ? `${coords.latitude}, ${coords.longitude}` : "Unknown"
      }, Region: ${region || "Unknown"}`
    );
  });

  // 4. Example with different evidence piece requirements
  console.log("\n4. Gathering evidence with different requirements...");

  // Request minimal evidence (5 pieces)
  const minimalEvidence = await gatherEvidenceWithGemini(
    "Leeds Public Transport Investment Programme",
    "Comprehensive programme to improve bus reliability and create cycling routes",
    "West Yorkshire",
    5
  );
  console.log(`Minimal evidence gathered: ${minimalEvidence.evidence.length} pieces`);

  // Request extensive evidence (20 pieces)
  const extensiveEvidence = await gatherEvidenceWithGemini(
    "Bradford City Centre Regeneration",
    "Multi-faceted regeneration effort including Bradford Live music venue",
    "West Yorkshire",
    20
  );
  console.log(`Extensive evidence gathered: ${extensiveEvidence.evidence.length} pieces`);

  // 5. Example of dateTime validation
  console.log("\n5. Testing dateTime validation...");

  const testEvidence = [
    {
      title: "Test Evidence 1",
      summary: "Test summary",
      source: "Test Source",
      sourceUrl: "https://test.com",
      evidenceDate: "2024-01-15",
      gatheredDate: "2024-01-15",
      gatheredBy: "AI Assistant",
      rawText: "This evidence was published on January 15, 2024",
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Test Evidence 2",
      summary: "Test summary",
      source: "Test Source",
      sourceUrl: "https://test.com",
      evidenceDate: "invalid-date",
      gatheredDate: "2024-01-15",
      gatheredBy: "AI Assistant",
      rawText: "This evidence was published on March 20, 2024",
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
  ];

  const validatedEvidence = processEvidenceWithDateTimeValidation(testEvidence);
  console.log("DateTime validation results:");
  validatedEvidence.forEach((item, index) => {
    console.log(`   ${index + 1}. "${item.title}" - Date: ${item.evidenceDate}`);
  });

  console.log("\n6. Available English Regions:");
  ENGLISH_REGIONS.forEach((region) => console.log(`   - ${region}`));
}

// Example of complete database workflow
async function exampleDatabaseWorkflow() {
  console.log("\n=== Complete Database Workflow Example ===\n");

  try {
    // 1. Initialize database
    console.log("1. Initializing database...");
    await initializeDatabase();

    // 2. Create a project with evidence
    console.log("\n2. Creating project with evidence...");
    const projectResult = await createProjectWithEvidence(
      "Leeds Public Transport Investment Programme",
      "Comprehensive programme to improve bus reliability and create cycling routes",
      "West Yorkshire",
      5
    );

    console.log(`Created project: ${projectResult.project.title}`);
    console.log(`Project ID: ${projectResult.project.id}`);
    console.log(`Evidence items: ${projectResult.evidence.length}`);
    if (projectResult.evaluation) {
      console.log(`Status: ${projectResult.evaluation.ragStatus}`);
      console.log(`Rationale: ${projectResult.evaluation.ragRationale}`);
      if (
        projectResult.evaluation.latitude != null &&
        projectResult.evaluation.longitude != null
      ) {
        console.log(
          `Location: ${projectResult.evaluation.latitude}, ${projectResult.evaluation.longitude}`
        );
      }
    }

    // 3. Get project with all data
    console.log("\n3. Fetching project with all data...");
    const fullProject = await getProject(projectResult.project.id);
    console.log(`Project: ${fullProject?.title}`);
    console.log(`Status: ${fullProject?.status}`);
    console.log(`Region: ${fullProject?.region?.name}`);
    console.log(`Local Authority: ${fullProject?.localAuthority?.name}`);
    console.log(`Evidence count: ${fullProject?.evidence.length}`);

    // 4. Get projects by region
    console.log("\n4. Fetching projects by region...");
    const yorkshireProjects = await getProjects({ region: "Yorkshire and the Humber" });
    console.log(`Found ${yorkshireProjects.length} projects in Yorkshire and the Humber`);

    // 5. Get project statistics
    console.log("\n5. Getting project statistics...");
    const stats = await getProjectStatistics();
    console.log(`Total projects: ${stats.totalProjects}`);
    console.log(`Total evidence: ${stats.totalEvidence}`);

    // 6. Get regions and local authorities
    console.log("\n6. Getting regions and local authorities...");
    const regions = await getRegions();
    const localAuthorities = await getLocalAuthorities();
    console.log(`Regions: ${regions.length}`);
    console.log(`Local Authorities: ${localAuthorities.length}`);
  } catch (error) {
    console.error("Database workflow error:", error);
  }
}

// Example of database integration (requires Prisma setup)
async function exampleDatabaseIntegration() {
  console.log("\n=== Database Integration Example ===\n");

  // This would require proper Prisma setup and database connection
  // const prisma = new PrismaClient();

  try {
    // Example of how to process evidence with database storage
    const mockEvidence = [
      {
        title: "Project Announcement",
        summary: "Government announces funding",
        source: "Department for Transport",
        sourceUrl: "https://www.gov.uk/transport",
        evidenceDate: "2023-01-15",
        gatheredDate: "2024-01-15",
        gatheredBy: "AI Assistant",
        rawText: "The Department for Transport has announced funding...",
        localAuthority: "Leeds City Council",
        region: "Yorkshire and the Humber",
      },
    ];

    console.log("Example evidence processing (database operations would happen here):");
    mockEvidence.forEach((item) => {
      console.log(`   - Title: ${item.title}`);
      console.log(`   - Authority: ${item.localAuthority}`);
      console.log(`   - Region: ${item.region}`);
    });

    // In a real implementation, you would call:
    // const processedEvidence = await processEvidenceWithLocation(
    //   prisma,
    //   mockEvidence,
    //   'project-id-here',
    //   1
    // );
  } catch (error) {
    console.error("Database integration example error:", error);
  }
}

// Run the examples
async function runExamples() {
  await exampleEvidenceGathering();
  await exampleDatabaseIntegration();
  await exampleDatabaseWorkflow();
}

// Export for use in other files
export {
  exampleEvidenceGathering,
  exampleDatabaseIntegration,
  exampleDatabaseWorkflow,
  runExamples,
};

// Run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
