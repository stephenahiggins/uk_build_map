import { Router, Request, Response } from 'express';
import prisma from '@/src/db';

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

export default router;
