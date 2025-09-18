import { Request, Response } from 'express';
import { RequestWithProfile } from '@/src/v1/types';
import prisma from '@/src/db';
import { ModerationState, UserType } from '@prisma/client';

export const listPendingEvidence = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    if (
      req.profile?.user_type !== UserType.ADMIN &&
      req.profile?.user_type !== UserType.MODERATOR
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const items = await prisma.evidenceItem.findMany({
      where: { moderationState: ModerationState.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(items);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to fetch evidence', details: err });
  }
};

export const approveEvidence = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    if (
      req.profile?.user_type !== UserType.ADMIN &&
      req.profile?.user_type !== UserType.MODERATOR
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id } = req.params;
    const updated = await prisma.evidenceItem.update({
      where: { id },
      data: { moderationState: ModerationState.APPROVED },
    });
    return res.json(updated);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to approve evidence', details: err });
  }
};

export const rejectEvidence = async (
  req: RequestWithProfile,
  res: Response
) => {
  try {
    if (
      req.profile?.user_type !== UserType.ADMIN &&
      req.profile?.user_type !== UserType.MODERATOR
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id } = req.params;
    const updated = await prisma.evidenceItem.update({
      where: { id },
      data: { moderationState: ModerationState.REJECTED },
    });
    return res.json(updated);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Failed to reject evidence', details: err });
  }
};
