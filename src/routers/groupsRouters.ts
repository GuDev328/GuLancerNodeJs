import { Router } from 'express';
import { createGroupController, getGroupByIdController, getMyGroupsController } from '~/controllers/groupsController';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createGroupController));
router.get('/my-groups', accessTokenValidator, catchError(getMyGroupsController));
router.get('/:id', accessTokenValidator, catchError(getGroupByIdController));

export default router;
