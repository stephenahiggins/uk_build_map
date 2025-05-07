import { Router } from 'express';
import { createInitiative, getInitiativeById, modifyInitiative, getInitiatives } from '@/src/v1/controllers/initiative.controller';
import authMiddleware from '@/src/v1/middlewares/authMiddleware';

const router = Router();

// All initiative routes require authentication
router.post('/', authMiddleware, createInitiative);
router.get('/', authMiddleware, getInitiatives);
router.get('/:id', authMiddleware, getInitiativeById);
router.post('/:id', authMiddleware, modifyInitiative);

export default router;
