import { Router } from 'express';
import {
  createGroupController,
  deleteGroupController,
  editGroupController,
  getGroupByIdController,
  getMembersController,
  getMyGroupsController,
  handlePendingMemberController,
  joinGroupController
} from '~/controllers/groupsController';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createGroupController));
router.post('/edit', accessTokenValidator, catchError(editGroupController));
router.get('/get-members/:id', accessTokenValidator, catchError(getMembersController));
router.get('/my-groups', accessTokenValidator, catchError(getMyGroupsController));
router.post('/join-group', accessTokenValidator, catchError(joinGroupController));
router.get('/:id', accessTokenValidator, catchError(getGroupByIdController));
router.post('/handle-member', accessTokenValidator, catchError(handlePendingMemberController));
router.delete('/:id', accessTokenValidator, catchError(deleteGroupController));

export default router;
