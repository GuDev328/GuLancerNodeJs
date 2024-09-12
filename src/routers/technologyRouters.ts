import { Router } from 'express';
import { createProjectController } from '~/controllers/projectsControllers';
import { getAllTechController } from '~/controllers/technologyControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.get('/', accessTokenValidator, catchError(getAllTechController));

export default router;
