import { Router } from 'express';
import {
  bookmarkController,
  createProjectController,
  getAllProjectsController,
  unbookmarkController
} from '~/controllers/projectsControllers';
import { bookmarkValidator } from '~/middlewares/projectsMiddlewares';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, catchError(createProjectController));
router.post('/get-all', accessTokenValidator, catchError(getAllProjectsController));
router.post('/bookmark', accessTokenValidator, bookmarkValidator, catchError(bookmarkController));
router.post('/unbookmark', accessTokenValidator, bookmarkValidator, catchError(unbookmarkController));

export default router;
