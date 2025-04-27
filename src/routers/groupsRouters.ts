import { Router } from 'express';
import {
  approveGroupReportController,
  createGroupController,
  createReportController,
  deleteGroupController,
  editGroupController,
  getGroupByIdController,
  getGroupReportsController,
  getGroupsListController,
  getMembersController,
  getMyGroupsController,
  handlePendingMemberController,
  joinGroupController,
  leaveGroupController,
  rejectGroupReportController,
  getTopGroupsStatisticsController
} from '~/controllers/groupsController';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createGroupController));
router.post('/edit', accessTokenValidator, catchError(editGroupController));
router.get('/get-members/:id', accessTokenValidator, catchError(getMembersController));
router.get('/my-groups', accessTokenValidator, catchError(getMyGroupsController));
router.post('/join-group', accessTokenValidator, catchError(joinGroupController));
router.put('/leave-group/:id', accessTokenValidator, catchError(leaveGroupController));

router.post('/handle-member', accessTokenValidator, catchError(handlePendingMemberController));
router.delete('/:id', accessTokenValidator, catchError(deleteGroupController));
router.post('/report/:id', accessTokenValidator, catchError(createReportController));

router.get('/reports', accessTokenValidator, catchError(getGroupReportsController));
router.post('/reject-report/:id', accessTokenValidator, catchError(rejectGroupReportController));
router.post('/approve-report/:id', accessTokenValidator, catchError(approveGroupReportController));
router.get('/list', accessTokenValidator, catchError(getGroupsListController));
router.get('/stats/top-groups', accessTokenValidator, catchError(getTopGroupsStatisticsController));
router.get('/:id', accessTokenValidator, catchError(getGroupByIdController));

export default router;
