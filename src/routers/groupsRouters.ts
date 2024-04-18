import { Router } from 'express';
import { createGroupController } from '~/controllers/groupsController';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createGroupController));

export default router;
