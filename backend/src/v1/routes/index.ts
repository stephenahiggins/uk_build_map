import { Router } from 'express';
import healthRoute from '@/src/v1/controllers/healthcheck/healthcheck';
import usersRoute from '@/src/v1/controllers/auth/auth.routes';
import regionRoute from '@/src/v1/controllers/region.controller';
import localAuthorityRoute from '@/src/v1/controllers/localAuthority.controller';

const router: Router = Router();

router.get('/', (req, res) => {
  res.send('Hello');
});

router.use('/health', healthRoute);
router.use('/auth', usersRoute);
router.use('/regions', regionRoute);
router.use('/local-authorities', localAuthorityRoute);

export default router;
