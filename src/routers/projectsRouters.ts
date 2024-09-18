import { Router } from 'express';
import {
  acceptApplyInviteController,
  applyInviteController,
  bookmarkController,
  createProjectController,
  getAllProjectsController,
  getApplyInviteController,
  getMyProjectsController,
  unbookmarkController
} from '~/controllers/projectsControllers';
import { bookmarkValidator, isAdminProjectValidator } from '~/middlewares/projectsMiddlewares';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createProjectController));
router.post('/get-all', accessTokenValidator, catchError(getAllProjectsController));
router.post('/apply-invite', accessTokenValidator, catchError(applyInviteController));
router.post('/get-apply-invite', accessTokenValidator, isAdminProjectValidator, catchError(getApplyInviteController));
router.post('/accept-apply-invite', accessTokenValidator, catchError(acceptApplyInviteController));
router.post('/bookmark', accessTokenValidator, bookmarkValidator, catchError(bookmarkController));
router.post('/unbookmark', accessTokenValidator, bookmarkValidator, catchError(unbookmarkController));

router.get('/get-my-projects', accessTokenValidator, catchError(getMyProjectsController));

export default router;
