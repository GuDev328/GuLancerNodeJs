import { Router } from 'express';
import { createTaskController, getAllTaskController } from '~/controllers/tasksControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/get-all', accessTokenValidator, catchError(getAllTaskController));
router.post('/create', accessTokenValidator, catchError(createTaskController));

export default router;
