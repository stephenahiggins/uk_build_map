import { Router, RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';

import consts from '@/src/common/config/consts';
import config from '@/src/common/config/config';
import {
  swaggerForbidden,
  swaggerBasePath,
} from '@/src/common/middlewares/swagger.middleware';

const router: Router = Router();

if (config.env !== 'production') {
  router.use(
    `${consts.API_DOCS_PATH}/:version`,
    ...(swaggerUi.serve as unknown as RequestHandler[]), // Workaround to make the types work
    swaggerBasePath
  );
} else {
  router.use(`${consts.API_DOCS_PATH}/:version`, swaggerForbidden);
}

export default router;
