import { Router } from 'express';
import {
  createGroupController,
  getGroupByIdController,
  getMyGroupsController,
  joinGroupController
} from '~/controllers/groupsController';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createGroupController));
router.get('/my-groups', accessTokenValidator, catchError(getMyGroupsController));
router.get('/:id', accessTokenValidator, catchError(getGroupByIdController));
router.post('/join-group', accessTokenValidator, catchError(joinGroupController));

export default router;
