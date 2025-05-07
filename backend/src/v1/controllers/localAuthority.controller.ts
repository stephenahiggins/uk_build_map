import { Router, Request, Response } from 'express';
import prisma from '@/src/db';
import { errorMetadata, ApiErrorMetadata } from '@/src/v1/services/errorCodes';

const router = Router();

// GET /api/local-authorities
router.get('/', async (req: Request, res: Response) => {
  try {
    const localAuthorities = await prisma.localAuthority.findMany({
      select: { id: true, name: true },
    });
    res.json(localAuthorities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch local authorities' });
  }
});

// POST /api/local-authorities
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, code, website, countryCode, regionId } = req.body;
    // Basic validation
    if (!name || !code || !countryCode || !regionId) {
      const error: ApiErrorMetadata = {
        ...errorMetadata.VALIDATION_ERROR,
        details: 'Missing required fields: name, code, countryCode, regionId',
      };
      return res.status(400).json(error);
    }
    // Create local authority
    const newAuthority = await prisma.localAuthority.create({
      data: {
        name,
        code,
        website,
        countryCode,
        regionId,
      },
    });
    return res.status(201).json({ status: 'success', data: newAuthority });
  } catch (err: any) {
    // Prisma error handling
    if (err.code === 'P2002') {
      // Unique constraint failed
      const error: ApiErrorMetadata = {
        ...errorMetadata.PRISMA_CONFLICT,
        details: err.meta,
      };
      return res.status(409).json(error);
    } else if (err.code === 'P2025') {
      // Not found
      const error: ApiErrorMetadata = {
        ...errorMetadata.PRISMA_NOT_FOUND,
        details: err.meta,
      };
      return res.status(404).json(error);
    } else if (err.code && err.code.startsWith('P2')) {
      // Other Prisma errors
      const error: ApiErrorMetadata = {
        ...errorMetadata.PRISMA_UNKNOWN,
        details: err.meta || err.message,
      };
      return res.status(500).json(error);
    } else {
      // Generic/internal error
      const error: ApiErrorMetadata = {
        ...errorMetadata.INTERNAL_ERROR,
        details: err.message,
      };
      return res.status(500).json(error);
    }
  }
});

export default router;
