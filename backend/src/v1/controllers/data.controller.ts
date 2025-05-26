import { Router, Request, Response } from 'express';
import prisma from '@/src/db';

const router = Router();

// GET /api/data/rag-status-by-region
router.get('/rag-status-by-region', async (req: Request, res: Response) => {
  try {
    // Get all regions
    const regions = await prisma.region.findMany({
      select: { id: true, name: true },
    });

    // Get all projects with regionId and status
    const projects = await prisma.project.findMany({
      select: { regionId: true, status: true },
    });

    // Aggregate counts by region and status
    const regionMap: Record<string, { name: string; RED: number; AMBER: number; GREEN: number }> = {};
    regions.forEach((region) => {
      regionMap[region.id] = { name: region.name, RED: 0, AMBER: 0, GREEN: 0 };
    });

    projects.forEach((project) => {
      if (project.regionId && regionMap[project.regionId]) {
        if (project.status === 'RED') regionMap[project.regionId].RED += 1;
        if (project.status === 'AMBER') regionMap[project.regionId].AMBER += 1;
        if (project.status === 'GREEN') regionMap[project.regionId].GREEN += 1;
      }
    });

    // Output as array
    const result = Object.entries(regionMap).map(([regionId, data]) => ({
      regionId,
      regionName: data.name,
      RED: data.RED,
      AMBER: data.AMBER,
      GREEN: data.GREEN,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch RAG status by region' });
  }
});

export default router;
