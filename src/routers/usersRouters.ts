import { Router } from 'express';
import {
  changePasswordController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  initRoleController,
  loginController,
  loginGoogleController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  unfollowController,
  updateMeController
} from '~/controllers/usersControllers';
import { filterMiddleware } from '~/middlewares/commonMiddlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  followValidator,
  forgotPasswordValidator,
  getProfileValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/usersMiddlewares';
import { UpdateMeRequest } from '~/models/requests/UserRequests';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/login', loginValidator, catchError(loginController));
router.get('/oauth/google', catchError(loginGoogleController));
router.post('/init-role', accessTokenValidator, catchError(initRoleController));
router.post('/register', registerValidator, catchError(registerController));
router.post('/logout', catchError(logoutController));
router.post('/refresh-token', refreshTokenValidator, catchError(refreshTokenController));
router.post('/forgot-password', forgotPasswordValidator, catchError(forgotPasswordController));
router.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordValidator,
  catchError(resetPasswordController)
);
router.get('/get-me', accessTokenValidator, catchError(getMeController));
router.patch(
  '/update-me',
  accessTokenValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeRequest>([
    'decodeAuthorization',
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo',
    'phone_number',
    'technology',
    'description_markdown',
    'description_html'
  ]),
  catchError(updateMeController)
);

router.get('/get-profile/:username', getProfileValidator, catchError(getProfileController));

router.post('/follow', accessTokenValidator, followValidator, catchError(followController));
router.post('/unfollow', accessTokenValidator, unfollowValidator, catchError(unfollowController));

router.post('/change-password', accessTokenValidator, changePasswordValidator, catchError(changePasswordController));

export default router;
