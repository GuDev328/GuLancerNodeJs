import { Router } from 'express';
import {
  createTaskController,
  getAllTaskController,
  getDetailTaskController,
  updateTaskController
} from '~/controllers/tasksControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/get-all', accessTokenValidator, catchError(getAllTaskController));
router.post('/create', accessTokenValidator, catchError(createTaskController));
router.post('/update', accessTokenValidator, catchError(updateTaskController));
router.get('/:id', accessTokenValidator, catchError(getDetailTaskController));

export default router;
