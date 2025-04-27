import { Router } from 'express';
import {
  blockAccountController,
  changePasswordController,
  deleteAccountController,
  followController,
  forgotPasswordController,
  getAmountHistoryController,
  getAmountInfoController,
  getListAccount,
  getListRequestVerifyController,
  getMeController,
  getOverallUserStatisticsController,
  getProfileByIDController,
  getProfileController,
  handleVerifyController,
  initRoleController,
  loginController,
  loginGoogleController,
  logoutController,
  refreshTokenController,
  registerController,
  requestVerifyController,
  resetPasswordController,
  unblockAccountController,
  unfollowController,
  updateMeController,
  getUserRegistrationStatsByYearController
} from '~/controllers/usersControllers';
import { filterMiddleware } from '~/middlewares/commonMiddlewares';
import {
  accessTokenValidator,
  changePasswordValidator,
  followValidator,
  forgotPasswordValidator,
  getProfileValidator,
  isAdminValidator,
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
router.post(
  '/update-me',
  accessTokenValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeRequest>([
    'decodeAuthorization',
    'name',
    'gender',
    'date_of_birth',
    'bio',
    'salary',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo',
    'phone_number',
    'fields',
    'technologies',
    'description'
  ]),
  catchError(updateMeController)
);

router.get('/get-profile/:username', getProfileValidator, catchError(getProfileController));

router.post('/follow', accessTokenValidator, followValidator, catchError(followController));
router.post('/unfollow', accessTokenValidator, unfollowValidator, catchError(unfollowController));
router.post('/change-password', accessTokenValidator, changePasswordValidator, catchError(changePasswordController));
router.get('/profile/:id', catchError(getProfileByIDController));

router.post('/list', accessTokenValidator, catchError(getListAccount));
router.post('/delete', accessTokenValidator, isAdminValidator, catchError(deleteAccountController));
router.post('/block', accessTokenValidator, isAdminValidator, catchError(blockAccountController));
router.post('/unblock', accessTokenValidator, isAdminValidator, catchError(unblockAccountController));
router.post('/request-verify', accessTokenValidator, catchError(requestVerifyController));

router.post('/list-request-verify', accessTokenValidator, isAdminValidator, catchError(getListRequestVerifyController));
router.post('/handle-verify', accessTokenValidator, isAdminValidator, catchError(handleVerifyController));

router.get('/amount-info', accessTokenValidator, catchError(getAmountInfoController));
router.get('/amount-history', accessTokenValidator, catchError(getAmountHistoryController));
router.get('/registration-stats', accessTokenValidator, catchError(getUserRegistrationStatsByYearController));
router.get('/overall-stats', accessTokenValidator, catchError(getOverallUserStatisticsController));

export default router;
