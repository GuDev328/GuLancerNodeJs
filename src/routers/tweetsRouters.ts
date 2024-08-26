import { Router } from 'express';
import {
  createTweetController,
  getNewsFeedController,
  getPostsByGroupIdController,
  getTweetChildrenController,
  getTweetController,
  likeController,
  unlikeController
} from '~/controllers/tweetsControllers';
import {
  createTweetValidator,
  getNewsFeedValidator,
  getTweetChildrenValidator,
  likeValidator,
  tweetIdValidator
} from '~/middlewares/tweetsMiddlewares';
import { accessTokenValidator, isLoginValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create', accessTokenValidator, createTweetValidator, catchError(createTweetController));

router.get('/tweet/:id', isLoginValidator(accessTokenValidator), tweetIdValidator, catchError(getTweetController));

router.get(
  '/tweet/:id/children',
  getTweetChildrenValidator,
  tweetIdValidator,
  isLoginValidator(accessTokenValidator),
  catchError(getTweetChildrenController)
);

router.get('/', getNewsFeedValidator, accessTokenValidator, catchError(getNewsFeedController));
router.get('/group/:id', getNewsFeedValidator, accessTokenValidator, catchError(getPostsByGroupIdController));

router.post('/like', accessTokenValidator, likeValidator, catchError(likeController));
router.post('/unlike', accessTokenValidator, likeValidator, catchError(unlikeController));

export default router;
