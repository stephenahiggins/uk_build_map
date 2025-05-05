import { Router, Request, Response } from 'express';
import prisma from '@/src/db';

const router = Router();

// GET /api/regions
router.get('/', async (req: Request, res: Response) => {
  try {
    const regions = await prisma.region.findMany({
      select: { id: true, name: true },
    });
    res.json(regions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch regions' });
  }
});

export default router;
