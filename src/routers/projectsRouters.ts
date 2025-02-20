import { Router } from 'express';
import {
  acceptApplyInviteController,
  applyInviteController,
  bookmarkController,
  createProjectController,
  EditMyProgressController,
  escrowController,
  getAllProjectsController,
  getApplyInviteController,
  getDetailProjectController,
  getMarketController,
  getMemberController,
  getMyProgressController,
  getMyProjectsController,
  getOverviewProgress,
  memberDonePhaseController,
  memberStartPhaseController,
  payForMemberController,
  rejectApplyInviteController,
  toProcessingController,
  toRecruitingController,
  unbookmarkController
} from '~/controllers/projectsControllers';
import {
  bookmarkValidator,
  isAdminProjectValidator,
  isMemberOrAdminProjectValidator
} from '~/middlewares/projectsMiddlewares';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createProjectController));
router.post('/get-all', accessTokenValidator, catchError(getAllProjectsController));
router.get('/get-detail-project/:id', accessTokenValidator, catchError(getDetailProjectController));
router.post('/apply-invite', accessTokenValidator, catchError(applyInviteController));
router.post('/get-apply-invite', accessTokenValidator, isAdminProjectValidator, catchError(getApplyInviteController));
router.post('/reject-apply-invite', accessTokenValidator, catchError(rejectApplyInviteController));
router.post('/accept-apply-invite', accessTokenValidator, catchError(acceptApplyInviteController));
router.get('/get-member/:id', accessTokenValidator, catchError(getMemberController));
router.post('/bookmark', accessTokenValidator, bookmarkValidator, catchError(bookmarkController));
router.post('/unbookmark', accessTokenValidator, bookmarkValidator, catchError(unbookmarkController));
router.post('/get-my-projects', accessTokenValidator, catchError(getMyProjectsController));
router.get('/my-progress/:project_id', accessTokenValidator, catchError(getMyProgressController));
router.post('/edit-my-progress', accessTokenValidator, catchError(EditMyProgressController));
router.get(
  '/overview-progress/:project_id',
  accessTokenValidator,
  isAdminProjectValidator,
  catchError(getOverviewProgress)
);

router.post('/escrow', accessTokenValidator, isAdminProjectValidator, catchError(escrowController));
router.get('/get-market', catchError(getMarketController));

router.post('/to-recruiting', accessTokenValidator, isAdminProjectValidator, catchError(toRecruitingController));
router.post(
  '/recruiting-to-processing',
  accessTokenValidator,
  isAdminProjectValidator,
  catchError(toProcessingController)
);

router.post('/member-start-phase', accessTokenValidator, catchError(memberStartPhaseController));
router.post('/member-done-phase', accessTokenValidator, catchError(memberDonePhaseController));
router.post('/pay-for-member', accessTokenValidator, isAdminProjectValidator, catchError(payForMemberController));

export default router;
