import { Response } from 'express';
import { RequestWithProfile } from '@/src/v1/types';
import prisma from '@/src/db';
import { UserType } from '@prisma/client';
import { getFileUrl } from '@/src/common/utils/fileUpload';

const VALID_LOCATION_CONFIDENCE = new Set(['LOW', 'MEDIUM', 'HIGH']);

// POST /projects - Create a project
export const createProject = async (req: RequestWithProfile, res: Response) => {
  try {
    const userId = req.profile?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      description,
      type,
      regionId,
      localAuthorityId,
      expectedCompletion,
      status,
      statusRationale,
      latitude,
      longitude,
      locationDescription,
      locationSource,
      locationConfidence,
    } = req.body;

    // Get the uploaded file path if it exists
    const imageUrl = req.file?.filename
      ? getFileUrl(req, req.file.filename)
      : null;

    // Validate and convert expectedCompletion
    // If expectedCompletion is empty or null, set it to null
    let isoExpectedCompletion = expectedCompletion;
    if (!expectedCompletion || expectedCompletion === '') {
      isoExpectedCompletion = null;
    } else if (expectedCompletion && !expectedCompletion.includes('T')) {
      // Convert date string to ISO-8601
      const dateObj = new Date(expectedCompletion);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          error:
            "Invalid 'expectedCompletion' format. Must be a valid date or ISO-8601 DateTime (e.g. 2025-05-15T00:00:00.000Z).",
        });
      }
      isoExpectedCompletion = dateObj.toISOString();
    } else if (
      expectedCompletion &&
      isNaN(new Date(expectedCompletion).getTime())
    ) {
      return res.status(400).json({
        error:
          "Invalid 'expectedCompletion' format. Must be a valid date or ISO-8601 DateTime (e.g. 2025-05-15T00:00:00.000Z).",
      });
    }

    // If localAuthorityId is empty or falsy, set to null for Prisma
    const derivedLocalAuthorityId =
      !localAuthorityId || localAuthorityId === '' ? null : localAuthorityId;

    const normalizedLocationConfidence =
      typeof locationConfidence === 'string'
        ? (() => {
            const upper = locationConfidence.trim().toUpperCase();
            return VALID_LOCATION_CONFIDENCE.has(upper)
              ? (upper as 'LOW' | 'MEDIUM' | 'HIGH')
              : undefined;
          })()
        : undefined;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        type,
        regionId,
        localAuthorityId: derivedLocalAuthorityId,
        expectedCompletion: isoExpectedCompletion,
        status,
        statusRationale,
        latitude,
        longitude,
        locationDescription,
        locationSource,
        locationConfidence: normalizedLocationConfidence,
        imageUrl,
        createdById: userId,
      },
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project', details: err });
  }
};

// GET /projects/:id - Retrieve project by ID
export const getProjectById = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        evidence: true,
      },
    });
    if (!project) return res.status(404).json({ error: 'project not found' });
    const { latitude, longitude, ...rest } = project;
    res.json({
      ...rest,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      locationDescription: project.locationDescription ?? null,
      locationSource: project.locationSource ?? null,
      locationConfidence: project.locationConfidence ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve project', details: err });
  }
};

const buildProjectWhere = (query: RequestWithProfile['query']) => {
  // Extract all possible filterable fields from query
  const {
    id,
    title,
    description,
    type,
    regionId,
    localAuthorityId,
    expectedCompletion,
    status,
    statusRationale,
    latitude,
    longitude,
    locationDescription,
    locationSource,
    locationConfidence,
    createdAt,
  } = query;

  // Build Prisma 'where' filter dynamically
  const where: any = {};
  if (id) where.id = id;
  if (title) where.title = { contains: title as string, mode: 'insensitive' };
  if (description) {
    where.description = {
      contains: description as string,
      mode: 'insensitive',
    };
  }
  if (type) where.type = type;
  if (regionId) where.regionId = regionId;
  if (localAuthorityId) where.localAuthorityId = localAuthorityId;
  if (expectedCompletion) {
    // Accept exact date or ISO string
    const date = new Date(expectedCompletion as string);
    if (!isNaN(date.getTime())) where.expectedCompletion = date;
  }
  if (status) where.status = status;
  if (statusRationale) {
    where.statusRationale = {
      contains: statusRationale as string,
      mode: 'insensitive',
    };
  }
  if (latitude) where.latitude = Number(latitude);
  if (longitude) where.longitude = Number(longitude);
  if (locationDescription) {
    where.locationDescription = {
      contains: locationDescription as string,
      mode: 'insensitive',
    };
  }
  if (locationSource) {
    where.locationSource = {
      contains: locationSource as string,
      mode: 'insensitive',
    };
  }
  if (locationConfidence && typeof locationConfidence === 'string') {
    const upper = locationConfidence.trim().toUpperCase();
    if (VALID_LOCATION_CONFIDENCE.has(upper)) {
      where.locationConfidence = upper as 'LOW' | 'MEDIUM' | 'HIGH';
    }
  }
  if (createdAt) {
    const date = new Date(createdAt as string);
    if (!isNaN(date.getTime())) where.createdAt = date;
  }

  return where;
};

// GET /projects - List all projects (optionally filtered by any parameter)
export const getProjects = async (req: RequestWithProfile, res: Response) => {
  try {
    const { page: pageQuery, limit: limitQuery } = req.query;

    const page = pageQuery ? parseInt(pageQuery as string, 10) : 1;
    const limit = limitQuery ? parseInt(limitQuery as string, 10) : 10;
    const skip = (page - 1) * limit;

    const where = buildProjectWhere(req.query);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          evidence: true,
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      data: projects,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects', details: err });
  }
};

// GET /projects/summary - summary counts for projects page
export const getProjectSummary = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    const where = buildProjectWhere(req.query);

    const [projectCount, evidenceCount, localAuthorityCount] =
      await Promise.all([
        prisma.project.count({ where }),
        prisma.evidenceItem.count({
          where: {
            project: where,
          },
        }),
        prisma.localAuthority.count(),
      ]);

    res.json({
      projectCount,
      evidenceCount,
      localAuthorityCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary', details: err });
  }
};

// POST /projects/:id - Modify an project
export const modifyProject = async (req: RequestWithProfile, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.profile?.user_id;
    const userType = req.profile?.user_type;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch the project to check permissions
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only admin, moderator, or creator can modify
    if (
      userType !== UserType.ADMIN &&
      userType !== UserType.MODERATOR &&
      project.createdById !== userId
    ) {
      return res
        .status(403)
        .json({ error: 'Forbidden: insufficient permissions' });
    }

    // Only allow updatable fields
    const {
      title,
      description,
      type,

      regionId,
      localAuthorityId,
      expectedCompletion,
      status,
      statusRationale,
      latitude,
      longitude,
      locationDescription,
      locationSource,
      locationConfidence,
    } = req.body;

    // Get the current project to check for existing image
    const currentProject = await prisma.project.findUnique({ where: { id } });

    // If there's a new file, update the image URL
    const imageUrl = req.file
      ? getFileUrl(req, req.file.filename)
      : currentProject?.imageUrl || null;

    const normalizedLocationConfidence =
      typeof locationConfidence === 'string'
        ? (() => {
            const upper = locationConfidence.trim().toUpperCase();
            return VALID_LOCATION_CONFIDENCE.has(upper)
              ? (upper as 'LOW' | 'MEDIUM' | 'HIGH')
              : undefined;
          })()
        : undefined;

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        type,
        regionId,
        localAuthorityId,
        imageUrl,
        expectedCompletion,
        status,
        statusRationale,
        latitude,
        longitude,
        locationDescription,
        locationSource,
        locationConfidence: normalizedLocationConfidence,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to modify project', details: err });
  }
};

// POST /projects/:id/evidence - Add evidence item to a project
export const addEvidence = async (req: RequestWithProfile, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.profile?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const {
      type,
      title,
      summary,
      source,
      url,
      datePublished,
      description,
      latitude,
      longitude,
    } = req.body;

    const evidence = await prisma.evidenceItem.create({
      data: {
        projectId: id,
        submittedById: userId,
        type,
        title,
        summary,
        source,
        url,
        datePublished: datePublished ? new Date(datePublished) : undefined,
        description,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
      },
    });

    res.status(201).json(evidence);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add evidence', details: err });
  }
};
