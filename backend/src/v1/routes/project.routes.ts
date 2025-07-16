import { Router } from 'express';
import {
  createProject,
  getProjectById,
  modifyProject,
  getProjects,
  addEvidence,
} from '@/src/v1/controllers/project.controller';
import { upload } from '@/src/common/utils/fileUpload';
import authMiddleware from '@/src/v1/middlewares/authMiddleware';
import config from '@/src/common/config/config';

const router = Router();

// router.post('/', createProject);
// router.get('/', getProjects);
// router.get('/:id', getProjectById);
// router.post('/:id', modifyProject);

router.post('/', authMiddleware, upload.single('image'), createProject);
router.get('/', authMiddleware, getProjects);
router.get('/:id', authMiddleware, getProjectById);
router.post('/:id', authMiddleware, modifyProject);
router.post('/:id/evidence', authMiddleware, addEvidence);

export default router;
