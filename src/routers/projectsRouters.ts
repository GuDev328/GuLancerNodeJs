import { Router } from 'express';
import {
  acceptApplyInviteController,
  applyInviteController,
  bookmarkController,
  createProjectController,
  getAllProjectsController,
  getApplyInviteController,
  getDetailProjectController,
  getMyProjectsController,
  rejectApplyInviteController,
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
router.post('/bookmark', accessTokenValidator, bookmarkValidator, catchError(bookmarkController));
router.post('/unbookmark', accessTokenValidator, bookmarkValidator, catchError(unbookmarkController));

router.post('/get-my-projects', accessTokenValidator, catchError(getMyProjectsController));

export default router;
