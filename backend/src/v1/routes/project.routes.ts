import { Router } from 'express';
import {
  createProject,
  getProjectById,
  modifyProject,
  getProjects,
} from '@/src/v1/controllers/project.controller';
import authMiddleware from '@/src/v1/middlewares/authMiddleware';
import config from '@/src/common/config/config';

const router = Router();

// router.post('/', createProject);
// router.get('/', getProjects);
// router.get('/:id', getProjectById);
// router.post('/:id', modifyProject);

router.post('/', authMiddleware, createProject);
router.get('/', authMiddleware, getProjects);
router.get('/:id', authMiddleware, getProjectById);
router.post('/:id', authMiddleware, modifyProject);

export default router;
