import { Router } from 'express';
import authMiddleware from '@/src/v1/middlewares/authMiddleware';
import {
  listPendingEvidence,
  approveEvidence,
  rejectEvidence,
} from '@/src/v1/controllers/evidence.controller';

const router = Router();

router.get('/', authMiddleware, listPendingEvidence);
router.post('/:id/approve', authMiddleware, approveEvidence);
router.post('/:id/reject', authMiddleware, rejectEvidence);

export default router;
