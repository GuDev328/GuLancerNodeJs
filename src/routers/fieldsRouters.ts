import { Router } from 'express';
import { getAllFieldController } from '~/controllers/fieldsControllers';
import { getAllTechController } from '~/controllers/technologyControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.get('/', accessTokenValidator, catchError(getAllFieldController));

export default router;
