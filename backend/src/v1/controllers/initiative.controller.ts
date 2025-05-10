import { Response } from 'express';
import { RequestWithProfile } from '@/src/v1/types';
import prisma from '@/src/db';
import { UserType } from '@prisma/client';

// POST /initiatives - Create an initiative
export const createInitiative = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    const userId = req.profile?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      description,
      type,
      ownerOrg,
      regionId,
      localAuthorityId,
      expectedCompletion,
      status,
      statusRationale,
      latitude,
      longitude,
    } = req.body;

    // Validate and convert expectedCompletion
    let isoExpectedCompletion = expectedCompletion;
    if (expectedCompletion && !expectedCompletion.includes('T')) {
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

    const initiative = await prisma.initiative.create({
      data: {
        title,
        description,
        type,
        ownerOrg,
        regionId,
        localAuthorityId,
        expectedCompletion: isoExpectedCompletion,
        status,
        statusRationale,
        latitude,
        longitude,
        createdById: userId,
      },
    });

    console.log('FOO', initiative);
    res.status(201).json(initiative);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to create initiative', details: err });
  }
};

// GET /initiatives/:id - Retrieve initiative by ID
export const getInitiativeById = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    const { id } = req.params;
    const initiative = await prisma.initiative.findUnique({
      where: { id },
    });
    if (!initiative)
      return res.status(404).json({ error: 'Initiative not found' });
    res.json(initiative);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to retrieve initiative', details: err });
  }
};

// GET /initiatives - List all initiatives (optionally filtered by type)
export const getInitiatives = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    // Optional filter: ?type=LOCAL_GOV|NATIONAL_GOV|REGIONAL_GOV
    const { type } = req.query;
    const where: any = {};
    if (type) {
      where.type = type;
    }
    const initiatives = await prisma.initiative.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        ownerOrg: true,
        regionId: true,
        localAuthorityId: true,
        expectedCompletion: true,
        status: true,
        statusRationale: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });
    res.json(initiatives);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to fetch initiatives', details: err });
  }
};

// POST /initiatives/:id - Modify an initiative
export const modifyInitiative = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.profile?.user_id;
    const userType = req.profile?.user_type;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch the initiative to check permissions
    const initiative = await prisma.initiative.findUnique({ where: { id } });
    if (!initiative)
      return res.status(404).json({ error: 'Initiative not found' });

    // Only admin, moderator, or creator can modify
    if (
      userType !== UserType.ADMIN &&
      userType !== UserType.MODERATOR &&
      initiative.createdById !== userId
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
      ownerOrg,
      regionId,
      localAuthorityId,
      expectedCompletion,
      status,
      statusRationale,
      latitude,
      longitude,
    } = req.body;

    const updated = await prisma.initiative.update({
      where: { id },
      data: {
        title,
        description,
        type,
        ownerOrg,
        regionId,
        localAuthorityId,
        expectedCompletion,
        status,
        statusRationale,
        latitude,
        longitude,
      },
    });
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Failed to modify initiative', details: err });
  }
};
