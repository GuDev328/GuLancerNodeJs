import { Router } from 'express';
import {
  createPaymentController,
  getPaymentOrderController,
  vnPayPaymentReturnController
} from '~/controllers/paymentController';
import { searchCommunityController, searchFreelancerController } from '~/controllers/searchControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create-payment', accessTokenValidator, catchError(createPaymentController));
router.get('/vnpay/payment-return', catchError(vnPayPaymentReturnController));
router.get('/payment-orders', accessTokenValidator, catchError(getPaymentOrderController));

export default router;
