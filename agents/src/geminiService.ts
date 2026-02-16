import { ProjectFoundItem, ProjectStatus } from "./types/projectEvidence";
import { envValues } from "./envValues";
import { evaluateProjectWithGemini as evaluateProjectInsights } from "../../backend/src/lib/projectEvaluation";
import { generateContentWithRetry } from "./llmRuntime";

/**
 * Map of English regions for validation and lookup
 */
export const ENGLISH_REGIONS = [
  "North East",
  "North West",
  "Yorkshire and the Humber",
  "East Midlands",
  "West Midlands",
  "East of England",
  "London",
  "South East",
  "South West",
] as const;

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanResponseText(text: string): string {
  let cleaned = text || "";
  if (cleaned.includes("```json")) {
    cleaned = cleaned.replace(/```json\s*/i, "").replace(/```\s*$/i, "");
  } else if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```\s*/i, "").replace(/```\s*$/i, "");
  }
  return cleaned;
}

function repairJson(text: string) {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return trimmed;
  }
  const sliced = trimmed.slice(firstBrace, lastBrace + 1);
  return sliced
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

function parseJsonWithRepair(text: string) {
  const direct = tryParseJson(text);
  if (direct) return direct;
  const repaired = repairJson(text);
  return tryParseJson(repaired);
}

async function parseJsonResponseWithRetry<T>(
  label: string,
  request: { contents: string; config?: { tools?: Array<Record<string, unknown>> } },
  responseText: string,
  attempts: number = 1
): Promise<T | null> {
  const cleaned = cleanResponseText(responseText);
  const parsed = parseJsonWithRepair(cleaned);
  if (parsed) return parsed as T;
  if (attempts <= 0) return null;

  const retryResponse = await generateContentWithRetry(`${label} (retry json)`, {
    contents: `${request.contents}\n\nIMPORTANT: Return ONLY valid JSON. Do not include commentary or code fences.`,
    ...(request.config ? { config: request.config } : {}),
    enforceJson: true,
  });
  const retryText = cleanResponseText(retryResponse.text || "");
  const retryParsed = parseJsonWithRepair(retryText);
  return retryParsed ? (retryParsed as T) : null;
}

/**
 * Helper function to validate and normalize region names
 */
export function normalizeRegion(region: string): string | null {
  const normalized = region.trim();
  return ENGLISH_REGIONS.find((r) => r.toLowerCase() === normalized.toLowerCase()) || null;
}

/**
 * Helper function to create or find a region in the database
 */
export async function findOrCreateRegion(prisma: any, regionName: string) {
  const normalizedRegion = normalizeRegion(regionName);
  if (!normalizedRegion) {
    console.warn(`Invalid region name: ${regionName}`);
    return null;
  }

  try {
    // Try to find existing region
    let region = await prisma.region.findUnique({
      where: { name: normalizedRegion },
    });

    // Create if not exists
    if (!region) {
      region = await prisma.region.create({
        data: { name: normalizedRegion },
      });
      console.log(`Created new region: ${normalizedRegion}`);
    }

    return region;
  } catch (error) {
    console.error(`Error finding/creating region ${regionName}:`, error);
    return null;
  }
}

/**
 * Helper function to create or find a local authority in the database
 */
export async function findOrCreateLocalAuthority(
  prisma: any,
  authorityName: string,
  regionId: string
) {
  try {
    // Try to find existing local authority
    let localAuthority = await prisma.localAuthority.findFirst({
      where: { name: authorityName },
    });

    // Create if not exists
    if (!localAuthority) {
      localAuthority = await prisma.localAuthority.create({
        data: {
          name: authorityName,
          code: authorityName.replace(/\s+/g, "_").toUpperCase(),
          countryCode: "ENGLAND",
          regionId: regionId,
        },
      });
      console.log(`Created new local authority: ${authorityName}`);
    }

    return localAuthority;
  } catch (error) {
    console.error(`Error finding/creating local authority ${authorityName}:`, error);
    return null;
  }
}

/**
 * Helper function to process evidence with geographic data
 */
export async function processEvidenceWithLocation(
  prisma: any,
  evidence: Array<{
    title: string;
    summary: string;
    source: string;
    sourceUrl: string;
    evidenceDate: string;
    gatheredDate: string;
    gatheredBy: string;
    rawText: string;
    latitude?: number;
    longitude?: number;
    localAuthority?: string;
    region?: string;
  }>,
  projectId: string,
  submittedById: number = 1
) {
  const processedEvidence = [];

  for (const item of evidence) {
    try {
      // Process region and local authority if provided
      let regionId = null;
      let localAuthorityId = null;

      if (item.region) {
        const region = await findOrCreateRegion(prisma, item.region);
        regionId = region?.id || null;
      }

      if (item.localAuthority && regionId) {
        const localAuthority = await findOrCreateLocalAuthority(
          prisma,
          item.localAuthority,
          regionId
        );
        localAuthorityId = localAuthority?.id || null;
      }

      // Create evidence item
      const evidenceItem = await prisma.evidenceItem.create({
        data: {
          projectId: projectId,
          submittedById: submittedById,
          type: "TEXT",
          title: item.title,
          summary: item.summary,
          source: item.source,
          url: item.sourceUrl,
          datePublished: item.evidenceDate ? new Date(item.evidenceDate) : null,
          description: item.rawText,
          latitude: item.latitude ? parseFloat(item.latitude.toString()) : null,
          longitude: item.longitude ? parseFloat(item.longitude.toString()) : null,
        },
      });

      processedEvidence.push(evidenceItem);
    } catch (error) {
      console.error(`Error processing evidence item "${item.title}":`, error);
    }
  }

  return processedEvidence;
}

/**
 * Helper function to validate and normalize dateTime stamps
 */
export function validateEvidenceDate(dateString: string): string | null {
  if (!dateString) return null;

  try {
    // Check if it's a valid date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      console.warn(`Invalid date format: ${dateString}. Expected YYYY-MM-DD format.`);
      return null;
    }

    // Validate the date is actually valid
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return null;
    }

    // Check if date is not in the future
    const now = new Date();
    if (date > now) {
      console.warn(`Future date detected: ${dateString}. Using current date instead.`);
      return new Date().toISOString().split("T")[0];
    }

    return dateString;
  } catch (error) {
    console.error(`Error validating date ${dateString}:`, error);
    return null;
  }
}

/**
 * Helper function to extract and validate dateTime from evidence text
 */
export function extractEvidenceDate(text: string): string | null {
  if (!text) return null;

  // Common date patterns in evidence text
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2}-\d{1,2}-\d{4})/g, // MM-DD-YYYY or DD-MM-YYYY
    /(\d{4}-\d{1,2}-\d{1,2})/g, // YYYY-MM-DD
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi, // DD Month YYYY
    /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi, // Month DD, YYYY
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Try to parse the first match
      const dateMatch = matches[0];
      try {
        const date = new Date(dateMatch);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      } catch (error) {
        // Continue to next pattern
      }
    }
  }

  return null;
}

/**
 * Helper function to process evidence with dateTime validation
 */
export function processEvidenceWithDateTimeValidation(
  evidence: Array<{
    title: string;
    summary: string;
    source: string;
    sourceUrl: string;
    evidenceDate: string;
    gatheredDate: string;
    gatheredBy: string;
    rawText: string;
    latitude?: number;
    longitude?: number;
    localAuthority?: string;
    region?: string;
  }>
) {
  return evidence.map((item) => {
    // Validate the evidenceDate
    let validatedDate = validateEvidenceDate(item.evidenceDate);

    // If no valid date, try to extract from rawText
    if (!validatedDate) {
      validatedDate = extractEvidenceDate(item.rawText);
      if (validatedDate) {
        console.log(`Extracted date ${validatedDate} from rawText for "${item.title}"`);
      }
    }

    // If still no valid date, use a fallback
    if (!validatedDate) {
      validatedDate = new Date().toISOString().split("T")[0];
      console.warn(`No valid date found for "${item.title}", using current date as fallback`);
    }

    return {
      ...item,
      evidenceDate: validatedDate,
    };
  });
}

/**
 * Helper function to create or find a default system user
 */
export async function findOrCreateSystemUser(prisma: any) {
  try {
    // Try to find existing system user
    let systemUser = await prisma.user.findFirst({
      where: { user_email: "system@lfg-agents.local" },
    });

    // Create if not exists
    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          user_name: "System User",
          user_email: "system@lfg-agents.local",
          user_password: "system-password-hash", // In production, use proper hashing
          type: "ADMIN",
          user_active: true,
          user_deleted: false,
        },
      });
      console.log("Created system user for automated operations");
    }

    return systemUser;
  } catch (error) {
    console.error("Error finding/creating system user:", error);
    return null;
  }
}

/**
 * Create a new project with geographic and administrative data
 */
export async function createProjectWithLocation(
  prisma: any,
  projectData: {
    title: string;
    description?: string;
    type?: "LOCAL_GOV" | "NATIONAL_GOV" | "REGIONAL_GOV";
    latitude?: number;
    longitude?: number;
    localAuthority?: string;
    region?: string;
    expectedCompletion?: Date;
    status?: "RED" | "AMBER" | "GREEN";
    statusRationale?: string;
    imageUrl?: string;
    locationDescription?: string;
    locationSource?: string;
    locationConfidence?: "LOW" | "MEDIUM" | "HIGH";
  },
  createdById?: number
) {
  try {
    // Get or create system user if no createdById provided
    let userId = createdById;
    if (!userId) {
      const systemUser = await findOrCreateSystemUser(prisma);
      userId = systemUser?.user_id || 1;
    }

    // Process region and local authority
    let regionId = null;
    let localAuthorityId = null;

    if (projectData.region) {
      const region = await findOrCreateRegion(prisma, projectData.region);
      regionId = region?.id || null;
    }

    if (projectData.localAuthority && regionId) {
      const localAuthority = await findOrCreateLocalAuthority(
        prisma,
        projectData.localAuthority,
        regionId
      );
      localAuthorityId = localAuthority?.id || null;
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        title: projectData.title,
        description: projectData.description,
        type: projectData.type || "LOCAL_GOV",
        createdById: userId,
        status: projectData.status || "AMBER",
        statusRationale: projectData.statusRationale,
        expectedCompletion: projectData.expectedCompletion,
        latitude: projectData.latitude ? parseFloat(projectData.latitude.toString()) : null,
        longitude: projectData.longitude ? parseFloat(projectData.longitude.toString()) : null,
        locationDescription: projectData.locationDescription ?? null,
        locationSource: projectData.locationSource ?? null,
        locationConfidence: projectData.locationConfidence ?? null,
        imageUrl: projectData.imageUrl,
        regionId: regionId,
        localAuthorityId: localAuthorityId,
      },
    });

    console.log(`Created project: ${project.title} with ID: ${project.id}`);
    return project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

/**
 * Complete evidence processing with all schema fields
 */
export async function processEvidenceComplete(
  prisma: any,
  evidence: Array<{
    title: string;
    summary: string;
    source: string;
    sourceUrl: string;
    evidenceDate: string;
    gatheredDate: string;
    gatheredBy: string;
    rawText: string;
    latitude?: number;
    longitude?: number;
    localAuthority?: string;
    region?: string;
  }>,
  projectId: string,
  submittedById?: number
) {
  // Get or create system user if no submittedById provided
  let userId = submittedById;
  if (!userId) {
    const systemUser = await findOrCreateSystemUser(prisma);
    userId = systemUser?.user_id || 1;
  }

  // Validate and process evidence with dateTime validation
  const validatedEvidence = processEvidenceWithDateTimeValidation(evidence);
  const processedEvidence = [];

  for (const item of validatedEvidence) {
    try {
      // Create evidence item with all fields
      const evidenceItem = await prisma.evidenceItem.create({
        data: {
          projectId: projectId,
          submittedById: userId,
          type: "TEXT", // Default to TEXT, could be enhanced to detect type
          title: item.title,
          summary: item.summary,
          source: item.source,
          url: item.sourceUrl,
          datePublished: item.evidenceDate ? new Date(item.evidenceDate) : null,
          description: item.rawText,
          latitude: item.latitude ? parseFloat(item.latitude.toString()) : null,
          longitude: item.longitude ? parseFloat(item.longitude.toString()) : null,
          moderationState: "PENDING", // Default moderation state
        },
      });

      processedEvidence.push(evidenceItem);
      console.log(`Created evidence item: ${item.title}`);
    } catch (error) {
      console.error(`Error processing evidence item "${item.title}":`, error);
    }
  }

  return processedEvidence;
}

/**
 * Complete workflow: Create project and gather evidence
 */
export async function createProjectWithEvidence(
  prisma: any,
  projectTitle: string,
  projectDescription: string,
  locale: string,
  maxEvidencePieces: number = 10,
  createdById?: number
) {
  try {
    // Step 1: Gather evidence for the project
    console.log(`Gathering evidence for project: ${projectTitle}`);
    const evidenceResults = await gatherEvidenceWithGemini(
      projectTitle,
      projectDescription,
      locale,
      maxEvidencePieces
    );

    // Step 2: Evaluate project status and primary location
    const evaluation = await evaluateProjectInsights(
      {
        projectName: projectTitle,
        projectDescription,
        locale,
        evidence: evidenceResults.evidence.map((item) => ({
          title: item.title,
          summary: item.summary,
          source: item.source,
          sourceUrl: item.sourceUrl,
          evidenceDate: item.evidenceDate,
          rawText: item.rawText,
        })),
      },
      {
        apiKey: envValues.GEMINI_API_KEY,
        model: envValues.MODEL,
        mockResponse: envValues.MOCK_PROJECT_EVALUATION,
      }
    );

    const projectData = {
      title: projectTitle,
      description: projectDescription,
      type: "LOCAL_GOV" as const,
      latitude: evaluation.latitude ?? undefined,
      longitude: evaluation.longitude ?? undefined,
      localAuthority: evidenceResults.projectLocation?.localAuthority,
      region: evidenceResults.projectLocation?.region,
      status: evaluation.ragStatus.toUpperCase() as "RED" | "AMBER" | "GREEN",
      statusRationale: evaluation.ragRationale,
      locationDescription: evaluation.locationDescription ?? undefined,
      locationSource: evaluation.locationSource ?? undefined,
      locationConfidence: evaluation.locationConfidence ?? undefined,
    };

    const project = await createProjectWithLocation(prisma, projectData, createdById);

    // Step 3: Process and store evidence
    if (evidenceResults.evidence.length > 0) {
      console.log(`Processing ${evidenceResults.evidence.length} evidence items...`);
      const processedEvidence = await processEvidenceComplete(
        prisma,
        evidenceResults.evidence,
        project.id,
        createdById
      );
      console.log(`Successfully processed ${processedEvidence.length} evidence items`);
    }

    return {
      project,
      evidence: evidenceResults.evidence,
      summary: evidenceResults.summary,
      evaluation,
    };
  } catch (error) {
    console.error("Error in createProjectWithEvidence:", error);
    throw error;
  }
}

/**
 * Update project status with rationale
 */
export async function updateProjectStatus(
  prisma: any,
  projectId: string,
  status: "RED" | "AMBER" | "GREEN",
  rationale?: string
) {
  try {
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: status,
        statusRationale: rationale,
        statusUpdatedAt: new Date(),
      },
    });

    console.log(`Updated project ${projectId} status to ${status}`);
    return updatedProject;
  } catch (error) {
    console.error("Error updating project status:", error);
    throw error;
  }
}

/**
 * Get project with all related data
 */
export async function getProjectWithEvidence(prisma: any, projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        evidence: {
          orderBy: { datePublished: "desc" },
        },
        region: true,
        localAuthority: true,
        createdBy: true,
        objectives: {
          include: {
            keyResults: true,
          },
        },
      },
    });

    return project;
  } catch (error) {
    console.error("Error fetching project with evidence:", error);
    throw error;
  }
}

/**
 * Search projects by region
 */
export async function getProjectsByRegion(prisma: any, regionName: string) {
  try {
    const normalizedRegion = normalizeRegion(regionName);
    if (!normalizedRegion) {
      throw new Error(`Invalid region name: ${regionName}`);
    }

    const projects = await prisma.project.findMany({
      where: {
        region: {
          name: normalizedRegion,
        },
      },
      include: {
        evidence: {
          orderBy: { datePublished: "desc" },
        },
        region: true,
        localAuthority: true,
      },
    });

    return projects;
  } catch (error) {
    console.error("Error fetching projects by region:", error);
    throw error;
  }
}

/**
 * Search for infrastructure projects in a specific locale using the configured LLM with web search
 */
export async function searchInfrastructureProjects(
  locale: string,
  minResults: number = 50,
  existingTitles: string[] = [],
  focusTheme?: string,
  options?: { forceMock?: boolean }
): Promise<{
  projects: Array<{
    title: string;
    description: string;
    status: string;
    source: string;
    url?: string;
    latitude?: number;
    longitude?: number;
    localAuthority?: string;
    region?: string;
  }>;
  summary: string;
}> {
  // Check if mock response is enabled
  if (options?.forceMock || envValues.MOCK_INFRASTRUCTURE_SEARCH) {
    console.log(
      "⚠️ ⚠️ Using mock response for infrastructure projects search. To use real results, set MOCK_INFRASTRUCTURE_SEARCH ⚠️ ⚠️"
    );
    return getMockInfrastructureResponse(locale, minResults);
  }

  const sanitizePromptText = (value: string) => value.replace(/`/g, "'");
  const uniqueExistingTitles = Array.from(
    new Set(
      existingTitles
        .map((title) => title?.trim())
        .filter((title): title is string => Boolean(title))
        .map((title) => sanitizePromptText(title))
    )
  );
  const dedupeTitles = uniqueExistingTitles.slice(-60);
  const dedupePrompt = dedupeTitles.length
    ? `ALREADY CATALOGUED SCHEMES – avoid returning the same projects unless you can surface a clearly distinct phase with its own scope/timeline:
${dedupeTitles.map((title) => `- ${title}`).join("\n")}`
    : "";
  const sanitizedFocus = focusTheme ? sanitizePromptText(focusTheme) : undefined;
  const focusPrompt = sanitizedFocus
    ? `PRIORITY FOCUS FOR THIS PASS: ${sanitizedFocus}. Surface additional ${sanitizedFocus.toLowerCase()} initiatives within ${locale}, including smaller funded schemes, enabling works, or recently announced proposals.`
    : "";

  // Define the grounding tool for web search (mapped per provider)
  const groundingTool = {
    googleSearch: {},
  };

  // Configure generation settings with grounding
  const modelConfig = {
    tools: [groundingTool],
  };

  const prompt = `You are collecting a comprehensive structured dataset of infrastructure projects in ${locale}.
Only return projects that are located within the United Kingdom. If a project is outside the UK, exclude it.

${focusPrompt ? `${focusPrompt}\n\n` : ""}${dedupePrompt ? `${dedupePrompt}\n\n` : ""}Collect projects across these categories (expand each):
- Road & transport (junction upgrades, bypasses, active travel corridors, maintenance programmes)
- Rail (station upgrades, line electrification, capacity improvements, new services, depots)
- Mass transit / bus priority / franchising prep
- Digital (broadband rollout phases, 5G pilots, fibre backbone)
- Energy (renewables, grid upgrades, EV charging hubs, district heat networks)
- Water & flood prevention (reservoir works, flood alleviation schemes, drainage upgrades)
- Regeneration / urban development (mixed‑use, housing-led, commercial, cultural, public realm)
- Public estate (schools, hospitals, civic buildings, courts, police, fire, university expansions)
- Utilities & environmental (waste facilities, recycling centres, carbon capture pilots)

MANDATORY MIN RESULT COUNT: Return AT LEAST ${minResults} distinct projects. If obvious major schemes are fewer, include:
- Smaller approved planning applications (with infrastructure impact)
- Funded feasibility or outline business case studies
- Phased sub‑projects of larger programmes (list each phase separately if it has its own scope/timeline)
- Recently completed (last 24 months) if still relevant to current regional capacity
- Announced / pipeline schemes with credible public reference

DE-DUPLICATE: Normalise titles (trim, remove phase/lot numbers) before checking uniqueness. If two sources describe the same project, keep one entry but prefer the richer description and most authoritative source (official authority, government dept, or operator). If phases truly differ (e.g. Phase 1 enabling works vs Phase 2 main build), keep both and note the phase in the title.
Do not repeat anything listed in ALREADY CATALOGUED SCHEMES above.

OUTPUT FORMAT RULES:
- Respond with RAW JSON ONLY (no markdown fences, no commentary)
- Ensure valid JSON parsable by a standard JSON parser
- All strings MUST be double-quoted

For each project include fields:
- title
- description (succinct, <= 40 words)
- status (Planning | Under Construction | Completed | Delayed | Cancelled | Feasibility | Approved)
- source (domain or organisation name)
- url (if available)
- latitude, longitude (if confidently known; else omit)
- localAuthority (if identifiable)
- region (English region if known)

After the array include a "summary" string (concise regional narrative).

Return JSON object shape:
{
  "projects": [
        {
          "title": "Project Name",
          "description": "Brief description",
          "status": "Current status",
          "source": "Information source",
          "url": "URL if available",
          "latitude": 53.7996,
          "longitude": -1.5491,
          "localAuthority": "Leeds City Council",
          "region": "Yorkshire and the Humber"
        }
      ],
      "summary": "Overall summary of infrastructure activity in the area"
    }`;

  const request = { contents: prompt, config: modelConfig };
  const response = await generateContentWithRetry("project search", request);
  try {
    const responseText = response.text || "";
    console.log("Raw response text:", responseText);

    // Try to parse JSON response
    try {
      const parsed = await parseJsonResponseWithRetry<{
        projects?: Array<{
          title: string;
          description: string;
          status: string;
          source: string;
          url?: string;
          latitude?: number;
          longitude?: number;
          localAuthority?: string;
          region?: string;
        }>;
        summary?: string;
      }>("project search", request, responseText);
      if (!parsed) throw new Error("Unable to parse JSON after retry.");
      console.log("Parsed response:", parsed);
      return {
        projects: parsed.projects || [],
        summary: parsed.summary || `Infrastructure projects search completed for ${locale}`,
      };
    } catch (parseError) {
      console.warn("Failed to parse JSON response from infrastructure search:", parseError);
      console.warn("Cleaned response text:", cleanResponseText(responseText));
      return {
        projects: [],
        summary: `Search completed for ${locale} but parsing failed`,
      };
    }
  } catch (error) {
    console.error("Error searching for infrastructure projects:", error);
    return {
      projects: [],
      summary: `Error searching for infrastructure projects in ${locale}`,
    };
  }
}

/**
 * Analyze evidence items using the configured LLM
 */
export async function analyseEvidenceWithGemini(evidenceItems: ProjectFoundItem[]): Promise<{
  summaries: string[];
  sentiment: "Positive" | "Negative" | "Neutral";
  status: "Red" | "Amber" | "Green";
}> {
  // Check if mock response is enabled
  if (envValues.MOCK_EVIDENCE_ANALYSIS) {
    console.log("Using mock response for evidence analysis");
    return getMockEvidenceAnalysis(evidenceItems);
  }

  const prompt = `Analyze the following government announcements and evidence items. 
    For each item, provide a brief summary and determine the overall sentiment and project status.
    
    Evidence items:
    ${evidenceItems
      .map(
        (item, index) =>
          `${index + 1}. ${item.summary || item.rawText?.substring(0, 200) || "No content"}`
      )
      .join("\n")}
    
    Please provide:
    1. A summary for each evidence item
    2. Overall sentiment (Positive/Negative/Neutral)
    3. Project status (Red/Amber/Green) based on the evidence
    
    Format your response as JSON:
    {
      "summaries": ["summary1", "summary2", ...],
      "sentiment": "Positive|Negative|Neutral",
      "status": "Red|Amber|Green"
    }`;
  const request = { contents: prompt };
  const response = await generateContentWithRetry("evidence analysis", request);

  try {
    const responseText = response.text || "";

    // Try to parse JSON response
    try {
      const parsed = await parseJsonResponseWithRetry<{
        summaries?: string[];
        sentiment?: "Positive" | "Negative" | "Neutral";
        status?: "Red" | "Amber" | "Green";
      }>("evidence analysis", request, responseText);
      if (!parsed) throw new Error("Unable to parse JSON after retry.");
      return {
        summaries: parsed.summaries || [],
        sentiment: parsed.sentiment || "Neutral",
        status: parsed.status || "Amber",
      };
    } catch (parseError) {
      // Fallback parsing if JSON parsing fails
      console.warn("Failed to parse JSON response, using fallback parsing:", parseError);
      console.warn("Cleaned response text:", cleanResponseText(responseText));
      return parseFallbackResponse(cleanResponseText(responseText), evidenceItems.length);
    }
  } catch (error) {
    console.error("Error calling LLM API:", error);
    return {
      summaries: evidenceItems.map(() => "Analysis failed"),
      sentiment: "Neutral",
      status: "Amber",
    };
  }
}

/**
 * Fallback parsing for non-JSON responses
 */
function parseFallbackResponse(responseText: string, itemCount: number) {
  const lines = responseText.split("\n");
  const summaries: string[] = [];
  let sentiment: "Positive" | "Negative" | "Neutral" = "Neutral";
  let status: "Red" | "Amber" | "Green" = "Amber";

  // Extract summaries (look for numbered items)
  for (let i = 0; i < itemCount; i++) {
    const summary = lines.find((line) => line.includes(`${i + 1}.`) || line.includes(`${i + 1}:`));
    summaries.push(summary ? summary.replace(/^\d+\.?\s*/, "").trim() : `Item ${i + 1}`);
  }

  // Extract sentiment and status from text
  const text = responseText.toLowerCase();
  if (text.includes("positive")) sentiment = "Positive";
  else if (text.includes("negative")) sentiment = "Negative";

  if (text.includes("red")) status = "Red";
  else if (text.includes("green")) status = "Green";

  return { summaries, sentiment, status };
}

/**
 * Get mock evidence analysis for testing
 */
function getMockEvidenceAnalysis(evidenceItems: ProjectFoundItem[]) {
  return {
    summaries: evidenceItems.map(
      (item, index) =>
        `Mock summary for evidence item ${index + 1}: ${
          item.summary || item.rawText?.substring(0, 50) || "No content"
        }`
    ),
    sentiment: "Positive" as const,
    status: "Green" as const,
  };
}

/**
 * Get project status using the configured LLM
 */
export async function getProjectStatusWithGemini(
  project: ProjectStatus
): Promise<"Red" | "Amber" | "Green"> {
  // Check if mock response is enabled
  if (envValues.MOCK_PROJECT_STATUS) {
    console.log("Using mock response for project status");
    return "Green";
  }

  const evidenceText = project.evidence
    .map((e, index) => {
      const evidenceItem = `Evidence ${index + 1}:
        Title: ${e.title || "N/A"}
        Source: ${e.source || "N/A"}
        Date: ${e.evidenceDate || "N/A"}
        Summary: ${e.summary || "N/A"}
        Raw Text: ${e.rawText?.substring(0, 300) || "N/A"}
        URL: ${e.sourceUrl || "N/A"}
        ---`;
      return evidenceItem;
    })
    .join("\n\n");

  const response = await generateContentWithRetry("project status", {
    contents: `You are an expert infrastructure project analyst. Analyze the following project and its evidence to determine the project status.

PROJECT DETAILS:
- Name: ${project.name}
- Description: ${project.description}
- Authority: ${project.authority}
- Last Updated: ${project.lastUpdated}

EVIDENCE COLLECTED:
${evidenceText}

ANALYSIS INSTRUCTIONS:
Based on the project details and evidence above, determine the overall project status:

RED: Major issues, significant delays, negative outcomes, or serious problems
- Multiple negative reports or delays
- Budget overruns or funding issues
- Safety concerns or regulatory problems
- Significant public opposition or criticism

AMBER: Some concerns, mixed signals, or moderate issues
- Some delays but progress is being made
- Mixed public opinion
- Minor budget or timeline issues
- Some positive developments but also concerns

GREEN: Positive progress, on track, or successful outcomes
- Good progress reports
- Positive public feedback
- On-time and on-budget delivery
- Successful milestones or completions

Consider the following factors:
1. Timeline and progress against original plans
2. Budget and financial performance
3. Public sentiment and stakeholder feedback
4. Quality of work and safety record
5. Environmental and social impact
6. Innovation and best practices

Return only one word: Red, Amber, or Green.`,
  });

  try {
    const status = (response.text || "").trim().toLowerCase();

    if (status.includes("red")) return "Red";
    if (status.includes("green")) return "Green";
    return "Amber";
  } catch (error) {
    console.error("Error getting project status:", error);
    return "Amber";
  }
}

/**
 * Generate embeddings using Gemini
 */
export async function embedTextWithGemini(text: string): Promise<number[]> {
  // For now, return a simple hash-based embedding since Gemini doesn't have a direct embedding API
  // In a real implementation, you might use a separate embedding service
  const hash = text.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  // Create a simple 384-dimensional embedding (similar to common embedding models)
  const embedding = new Array(384).fill(0);
  for (let i = 0; i < 384; i++) {
    embedding[i] = Math.sin(hash + i) * 0.5;
  }

  return embedding;
}
/**
 * Get mock infrastructure response for testing
 */
function getMockInfrastructureResponse(locale: string, minResults: number = 5) {
  const allProjects = [
    {
      title: "Transpennine Route Upgrade (TRU)",
      description:
        "A multi-billion-pound programme to upgrade the railway line between Manchester, Leeds, and York, delivering electrification, digital signalling, and increased capacity. Sections in West Yorkshire include improvements around Huddersfield, Mirfield, and Leeds.",
      status: "Under Construction (multi-year, phased programme)",
      source: "Network Rail, West Yorkshire Combined Authority (WYCA)",
      url: "https://www.networkrail.co.uk/running-the-railway/our-performance-and-plans/programmes/transpennine-route-upgrade/",
      latitude: 53.7996,
      longitude: -1.5491,
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Leeds Public Transport Investment Programme (LPTIP) / Connecting Leeds",
      description:
        "A comprehensive programme of schemes to improve bus reliability and journey times, create new cycling and walking routes, and enhance public spaces across Leeds, aiming to make travel around the city easier and more sustainable.",
      status: "Under Construction / Phased Completion (ongoing programme)",
      source: "Leeds City Council, West Yorkshire Combined Authority (WYCA)",
      url: "https://www.leeds.gov.uk/parking-roads-and-travel/connecting-leeds-schemes",
      latitude: 53.7996,
      longitude: -1.5491,
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Bradford City Centre Regeneration (including Bradford Live)",
      description:
        "A multi-faceted regeneration effort in Bradford City Centre. Key elements include the redevelopment of the former Odeon cinema into the 'Bradford Live' music venue, improvements to public spaces, and planning for new commercial and residential developments to revitalise the city core.",
      status:
        "Ongoing / Phased (Bradford Live nearing completion, other elements under construction or planning)",
      source: "Bradford Council, Bradford Live",
      url: "https://www.bradford.gov.uk/planning-and-building-control/major-developments/major-developments-in-bradford-city-centre/",
      latitude: 53.794,
      longitude: -1.7524,
      localAuthority: "Bradford Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Dewsbury Blueprint",
      description:
        "A £200 million regeneration plan for Dewsbury town centre, focusing on creating a vibrant cultural and economic hub. Projects include a new library and archives, a revitalised market, improvements to the bus station and transport links, and enhanced public realm.",
      status: "Under Construction / Phased (e.g., Market Hall and Library works progressing)",
      source: "Kirklees Council",
      url: "https://www.kirklees.gov.uk/beta/dewsbury-blueprint/index.aspx",
      latitude: 53.6908,
      longitude: -1.6297,
      localAuthority: "Kirklees Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Huddersfield Blueprint",
      description:
        "A 10-year, £250 million regeneration programme for Huddersfield town centre. Key components include the creation of a 'Cultural Heart' (integrating a new library, museum, and art gallery), improved public spaces, and enhanced transport links around Huddersfield Station.",
      status:
        "Under Construction / Phased (initial works on Cultural Heart and public realm ongoing)",
      source: "Kirklees Council",
      url: "https://www.kirklees.gov.uk/beta/huddersfield-blueprint/index.aspx",
      latitude: 53.6458,
      longitude: -1.785,
      localAuthority: "Kirklees Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Leeds Flood Alleviation Scheme (Phases 1 & 2)",
      description:
        "A major flood defence initiative along the River Aire. Phase 1, protecting the city centre, is complete. Phase 2 extends protection upstream from Kirkstall to Apperley Bridge, involving the creation of flood storage areas and widening of the river channel.",
      status: "Phase 1 Completed, Phase 2 Under Construction",
      source: "Environment Agency, Leeds City Council",
      url: "https://news.leeds.gov.uk/flood-alleviation-scheme",
      latitude: 53.7996,
      longitude: -1.5491,
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "West Yorkshire Gigabit Broadband Rollout",
      description:
        "Ongoing commercial and government-backed initiatives (such as Project Gigabit) to deploy full-fibre broadband infrastructure across West Yorkshire, significantly increasing internet speeds and reliability for homes and businesses in urban and rural areas.",
      status: "Ongoing (phased deployment across the region)",
      source:
        "Ofcom, various Internet Service Providers (e.g., Openreach, CityFibre), West Yorkshire Combined Authority",
      url: "https://www.wyca.org.uk/what-we-do/connectivity/digital-strategy/",
      latitude: 53.7996,
      longitude: -1.5491,
      localAuthority: "West Yorkshire Combined Authority",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Leeds District Heating Network Expansion",
      description:
        "The continued expansion of Leeds' city-wide district heating network, which utilises heat recovered from an energy recovery facility to provide low-carbon heating and hot water to public buildings, businesses, and homes across the city.",
      status: "Under Construction / Expanding",
      source: "Leeds City Council",
      url: "https://www.leeds.gov.uk/business/housing-and-regeneration/energy/district-heating",
      latitude: 53.7996,
      longitude: -1.5491,
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "South Bank Leeds Regeneration",
      description:
        "One of Europe's largest city-centre regeneration schemes, transforming an area south of Leeds city centre. It involves creating a vibrant mixed-use neighbourhood with new residential and commercial buildings, educational facilities, and extensive green spaces, including Aire Park.",
      status: "Ongoing / Phased Development",
      source: "Leeds City Council, South Bank Leeds partnership",
      url: "https://southbankleeds.co.uk/",
      latitude: 53.7996,
      longitude: -1.5491,
      localAuthority: "Leeds City Council",
      region: "Yorkshire and the Humber",
    },
    {
      title: "Halifax Town Centre Transformation / A629 Improvement Scheme",
      description:
        "A programme of transport and public realm improvements in Halifax town centre, including enhanced pedestrian and cycle routes, bus priority measures, and a major highway upgrade on the A629 Salterhebble to Shaw Hill section, improving access into the town.",
      status:
        "Under Construction / Phased Completion (A629 section completed, town centre ongoing)",
      source: "Calderdale Council, West Yorkshire Combined Authority (WYCA)",
      url: "https://www.calderdale.gov.uk/v2/residents/transport-and-streets/highways/a629-improvement-scheme",
      latitude: 53.7231,
      longitude: -1.8573,
      localAuthority: "Calderdale Council",
      region: "Yorkshire and the Humber",
    },
  ];

  // Ensure we return at least the minimum number of projects
  const projects = allProjects.slice(0, Math.max(minResults, allProjects.length));

  return {
    projects,
    summary:
      "West Yorkshire is currently undergoing a significant period of infrastructure development and regeneration across various sectors. There is a strong emphasis on improving transport links, with major rail upgrades like the Transpennine Route Upgrade (TRU) aimed at increasing capacity and connectivity. Urban mobility is also a key focus, evidenced by programmes like Leeds Public Transport Investment Programme and Halifax Town Centre Transformation, which prioritise public transport, cycling, and walking infrastructure.\n" +
      "\n" +
      "City and town centre regeneration is prominent, with ambitious 'Blueprints' in Dewsbury and Huddersfield, and large-scale mixed-use developments such as South Bank Leeds and various projects in Bradford. These often combine public building revitalisation, public realm enhancements, and new residential/commercial spaces.\n" +
      "\n" +
      "Environmental infrastructure is a significant investment area, particularly in flood protection with the ongoing Leeds Flood Alleviation Scheme and various projects in Calderdale. Low-carbon energy initiatives like the expansion of the Leeds District Heating Network also demonstrate a commitment to sustainability. Digital connectivity continues to improve across the region with widespread gigabit broadband and 5G rollouts. Overall, West Yorkshire is experiencing a comprehensive transformation, driven by local authorities, regional bodies like WYCA, and national funding, aiming to enhance economic growth, connectivity, and quality of life.",
  };
}

/**
 * Gather evidence for a specific infrastructure project using the configured LLM with web search
 * This creates a timeline of news, documents, and information about the project
 */
export async function gatherEvidenceWithGemini(
  projectTitle: string,
  projectDescription: string,
  locale: string,
  maxEvidencePieces: number = 10,
  options?: { forceMock?: boolean }
): Promise<{
  evidence: Array<{
    title: string;
    summary: string;
    source: string;
    sourceUrl: string;
    evidenceDate: string; // Date the evidence applies to
    gatheredDate: string; // Date the evidence was gathered
    gatheredBy: string; // Organisation or person who gathered the evidence
    rawText: string;
    latitude?: number; // Geographic coordinates
    longitude?: number;
    localAuthority?: string; // Local authority name
    region?: string; // Region name (e.g., "Yorkshire and the Humber")
  }>;
  summary: string;
  projectLocation?: {
    latitude: number;
    longitude: number;
    localAuthority: string;
    region: string;
  };
}> {
  // Check if mock response is enabled
  if (options?.forceMock || envValues.MOCK_EVIDENCE_GATHERING) {
    console.log(
      "⚠️ ⚠️ Using mock response for evidence gathering. To use real results, set MOCK_EVIDENCE_GATHERING ⚠️ ⚠️"
    );
    return getMockEvidenceGathering(projectTitle, projectDescription, locale);
  }

  // Define the grounding tool for web search (mapped per provider)
  const groundingTool = {
    googleSearch: {},
  };

  // Configure generation settings with grounding
  const modelConfig = {
    tools: [groundingTool],
  };

  const prompt = `Search for evidence and information about the infrastructure project: "${projectTitle}" in ${locale}.
    
    Project Description: ${projectDescription}
    
    Look for:
    - News articles and press releases
    - Government announcements and updates
    - Planning documents and consultations
    - Progress reports and status updates
    - Public consultations and feedback
    - Budget announcements and funding updates
    - Environmental impact assessments
    - Community engagement activities
    - Technical reports and feasibility studies
    - Any official documents or statements
    
    IMPORTANT: For each piece of evidence, also try to determine:
    - The specific location (latitude and longitude coordinates) where the project is located
    - The local authority responsible for the area (e.g., "Leeds City Council", "Bradford Council")
    - The region of England where this is located (one of: North East, North West, Yorkshire and the Humber, East Midlands, West Midlands, East of England, London, South East, South West)
    
    For each piece of evidence found, provide:
    - Title/headline of the evidence
    - Summary of the content
    - Source (website, organization, publication)
    - URL if available
    - Date the evidence applies to (when the event/report occurred) - CRITICAL: This must be a specific date in YYYY-MM-DD format
    - Date the evidence was gathered (today's date)
    - Organisation or person who gathered this evidence (use "AI Assistant" for automated gathering)
    - Latitude and longitude coordinates (if available)
    - Local authority name (if available)
    - Region name (if available)
    
    CRITICAL: Each evidence item MUST have a specific dateTime stamp in the evidenceDate field. This should be the actual date when the event, announcement, or report occurred, not when it was found. Use the most specific date available from the source material.
    
    IMPORTANT: Please find no more than ${maxEvidencePieces} pieces of evidence. If you cannot find any evidence pieces, include smaller or less prominent evidence, ongoing updates, or planned activities to reach the minimum.
    
    Create a comprehensive timeline of evidence from the earliest to most recent information.
    
    IMPORTANT: Format your response as valid JSON only. Ensure all strings are properly quoted and closed.
    
    Return ONLY valid JSON in this exact format:
    {
      "evidence": [
        {
          "title": "Evidence title",
          "summary": "Brief summary of the evidence",
          "source": "Source name",
          "sourceUrl": "URL if available",
          "evidenceDate": "YYYY-MM-DD",
          "gatheredDate": "YYYY-MM-DD",
          "gatheredBy": "AI Assistant",
          "rawText": "Full text content or description",
          "latitude": 53.7996,
          "longitude": -1.5491,
          "localAuthority": "Leeds City Council",
          "region": "Yorkshire and the Humber"
        }
      ],
      "summary": "Overall summary of evidence gathered for this project",
      "projectLocation": {
        "latitude": 53.7996,
        "longitude": -1.5491,
        "localAuthority": "Leeds City Council",
        "region": "Yorkshire and the Humber"
      }
    }
    
    IMPORTANT: Every evidence item MUST have a valid evidenceDate in YYYY-MM-DD format. This date should represent when the actual event, announcement, or report occurred, not when it was discovered or gathered.
    
    CRITICAL: Ensure all JSON strings are properly quoted and closed. Do not include any text before or after the JSON.`;

  const request = { contents: prompt, config: modelConfig };
  const response = await generateContentWithRetry("evidence gathering", request);

  try {
    const responseText = response.text || "";
    console.log("Raw evidence gathering response text:", responseText);

    // Try to parse JSON response
    try {
      const parsed = await parseJsonResponseWithRetry<{
        evidence?: Array<{
          title: string;
          summary: string;
          source: string;
          sourceUrl: string;
          evidenceDate: string;
          gatheredDate: string;
          gatheredBy: string;
          rawText: string;
          latitude?: number;
          longitude?: number;
          localAuthority?: string;
          region?: string;
        }>;
        summary?: string;
        projectLocation?: {
          latitude: number;
          longitude: number;
          localAuthority: string;
          region: string;
        };
      }>("evidence gathering", request, responseText);
      if (!parsed) throw new Error("Unable to parse JSON after retry.");
      console.log("Parsed evidence gathering response:", parsed);
      return {
        evidence: parsed.evidence || [],
        summary: parsed.summary || `Evidence gathering completed for ${projectTitle}`,
        projectLocation: parsed.projectLocation,
      };
    } catch (parseError) {
      console.warn("Failed to parse JSON response from evidence gathering:", parseError);
      console.warn("Cleaned response text:", cleanResponseText(responseText));
      return {
        evidence: [],
        summary: `Evidence gathering completed for ${projectTitle} but parsing failed`,
      };
    }
  } catch (error) {
    console.error("Error gathering evidence for project:", error);
    return {
      evidence: [],
      summary: `Error gathering evidence for ${projectTitle}`,
    };
  }
}

/**
 * Get mock evidence gathering response for testing
 */
function getMockEvidenceGathering(
  projectTitle: string,
  projectDescription: string,
  locale: string,
  maxEvidencePieces: number = 10
) {
  const today = new Date().toISOString().split("T")[0];

  // Mock location data for West Yorkshire projects
  const mockLocation = {
    latitude: 53.7996,
    longitude: -1.5491,
    localAuthority: "Leeds City Council",
    region: "Yorkshire and the Humber",
  };

  // Create a base set of evidence items with realistic dateTime stamps
  const baseEvidence = [
    {
      title: "Initial Project Announcement",
      summary: "Government announces funding for the project with initial timeline and scope",
      source: "Department for Transport",
      sourceUrl: "https://www.gov.uk/transport",
      evidenceDate: "2023-01-15",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "The Department for Transport has announced £500 million in funding for the project, with construction expected to begin in 2024 and completion by 2027.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Planning Permission Granted",
      summary: "Local authority grants planning permission after public consultation period",
      source: `${locale} Council`,
      sourceUrl: "https://www.localcouncil.gov.uk/planning",
      evidenceDate: "2023-06-20",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "Planning permission has been granted for the project following a successful public consultation period. The project will now proceed to the construction phase.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Environmental Impact Assessment Published",
      summary: "Comprehensive environmental study shows minimal impact on local ecosystem",
      source: "Environmental Agency",
      sourceUrl: "https://www.environment-agency.gov.uk",
      evidenceDate: "2023-08-15",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "The Environmental Impact Assessment has been completed and published. The study indicates that the project will have minimal impact on the local environment with appropriate mitigation measures in place.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Construction Phase Begins",
      summary: "Groundbreaking ceremony marks the start of construction work",
      source: "Project Consortium",
      sourceUrl: "https://www.projectconsortium.com",
      evidenceDate: "2024-03-15",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "Construction has officially begun on the project with a groundbreaking ceremony attended by local officials and project stakeholders. The first phase is expected to take 18 months.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Community Engagement Update",
      summary: "Regular community meetings established to keep residents informed of progress",
      source: "Community Liaison Office",
      sourceUrl: "https://www.communityliaison.gov.uk",
      evidenceDate: "2024-05-20",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "The project team has established regular community engagement meetings to keep local residents informed of construction progress and address any concerns.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Budget Allocation Confirmed",
      summary: "Additional funding secured for project expansion and enhanced features",
      source: "Treasury Department",
      sourceUrl: "https://www.gov.uk/treasury",
      evidenceDate: "2024-07-25",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "The Treasury has confirmed additional funding allocation for the project, allowing for enhanced features and expanded scope. This brings the total project budget to £750 million.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Technical Design Review Completed",
      summary: "Engineering team completes comprehensive technical design review",
      source: "Engineering Consortium",
      sourceUrl: "https://www.engineeringconsortium.com",
      evidenceDate: "2024-08-30",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "The engineering team has completed a comprehensive technical design review, incorporating feedback from stakeholders and ensuring all safety and performance standards are met.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Public Consultation Results Published",
      summary: "Overwhelming public support for project with 85% approval rating",
      source: "Public Consultation Office",
      sourceUrl: "https://www.publicconsultation.gov.uk",
      evidenceDate: "2024-09-15",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "Results from the public consultation period show overwhelming support for the project with an 85% approval rating. Community feedback has been incorporated into the final design.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Supply Chain Contracts Awarded",
      summary: "Major contracts awarded to local and national suppliers",
      source: "Procurement Department",
      sourceUrl: "https://www.procurement.gov.uk",
      evidenceDate: "2024-10-12",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "Major supply chain contracts have been awarded to local and national suppliers, creating jobs and supporting the local economy. This represents a significant milestone in project delivery.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
    {
      title: "Safety Protocol Implementation",
      summary: "Comprehensive safety protocols implemented across all project sites",
      source: "Health and Safety Executive",
      sourceUrl: "https://www.hse.gov.uk",
      evidenceDate: "2024-11-08",
      gatheredDate: today,
      gatheredBy: "AI Assistant",
      rawText:
        "Comprehensive safety protocols have been implemented across all project sites, ensuring the highest standards of worker and public safety throughout the construction phase.",
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      localAuthority: mockLocation.localAuthority,
      region: mockLocation.region,
    },
  ];

  // Return the requested number of evidence pieces (up to the available amount)
  const evidence = baseEvidence.slice(0, Math.min(maxEvidencePieces, baseEvidence.length));

  return {
    evidence,
    summary: `Evidence gathering for ${projectTitle} reveals a well-structured project with proper planning, environmental considerations, and community engagement. The project appears to be progressing according to schedule with strong stakeholder involvement.`,
    projectLocation: mockLocation,
  };
}
