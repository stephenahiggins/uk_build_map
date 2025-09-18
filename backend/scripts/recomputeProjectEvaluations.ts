import "dotenv/config";
import { PrismaClient, ProjectStatus as PrismaProjectStatus } from "@prisma/client";
import { evaluateProjectWithGemini } from "../../shared/projectEvaluation";

const prisma = new PrismaClient();

type PrismaStatus = PrismaProjectStatus;

function toPrismaStatus(status: "Red" | "Amber" | "Green"): PrismaStatus {
  switch (status) {
    case "Red":
      return "RED";
    case "Green":
      return "GREEN";
    default:
      return "AMBER";
  }
}

async function recompute() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY must be set to run the project evaluation recompute script.");
  }

  const model = process.env.GEMINI_MODEL || process.env.MODEL;
  const mock = process.env.MOCK_PROJECT_EVALUATION === "true";

  const projects = await prisma.project.findMany({
    include: {
      evidence: {
        orderBy: {
          datePublished: "desc",
        },
      },
      region: true,
      localAuthority: true,
    },
  });

  console.log(`Found ${projects.length} projects to evaluate.`);

  for (const project of projects) {
    const evaluation = await evaluateProjectWithGemini(
      {
        projectName: project.title,
        projectDescription: project.description || undefined,
        locale: project.region?.name || undefined,
        evidence: project.evidence.map((item) => ({
          title: item.title || undefined,
          summary: item.summary || undefined,
          source: item.source || undefined,
          sourceUrl: item.url || undefined,
          evidenceDate: item.datePublished ? item.datePublished.toISOString().slice(0, 10) : undefined,
          rawText: item.description || undefined,
        })),
      },
      {
        apiKey,
        model: model || undefined,
        mockResponse: mock,
      }
    );

    console.log(
      `Updating ${project.title} -> status ${evaluation.ragStatus} (${evaluation.ragRationale || "no rationale"})`
    );

    await prisma.project.update({
      where: { id: project.id },
      data: {
        status: toPrismaStatus(evaluation.ragStatus),
        statusRationale: evaluation.ragRationale,
        statusUpdatedAt: new Date(),
        latitude: evaluation.latitude,
        longitude: evaluation.longitude,
      },
    });
  }
}

recompute()
  .catch((error) => {
    console.error("Failed to recompute project evaluations", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
