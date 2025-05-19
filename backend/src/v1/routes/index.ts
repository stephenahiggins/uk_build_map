import { Router } from 'express';
import healthRoute from '@/src/v1/controllers/healthcheck/healthcheck';
import usersRoute from '@/src/v1/controllers/auth/auth.routes';
import regionRoute from '@/src/v1/controllers/region.controller';
import localAuthoritiesRoute from '@/src/v1/routes/localAuthorities.routes';
import projectRoute from '@/src/v1/routes/project.routes';

const router: Router = Router();

router.get('/', (req, res) => {
  res.send('Hello');
});

router.use('/health', healthRoute);
router.use('/auth', usersRoute);
router.use('/regions', regionRoute);
router.use('/local-authorities', localAuthoritiesRoute);
router.use('/projects', projectRoute);

export default router;
