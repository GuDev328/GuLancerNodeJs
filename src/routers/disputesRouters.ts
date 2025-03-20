import { Router } from 'express';
import { createDisputeController } from '~/controllers/disputesControllers';
import {
  createPaymentController,
  getPaymentOrderController,
  vnPayPaymentReturnController
} from '~/controllers/paymentController';
import { searchCommunityController, searchFreelancerController } from '~/controllers/searchControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('', accessTokenValidator, catchError(createDisputeController));
router.get('/:id', accessTokenValidator, catchError(getDisputeByIdController));
router.put('/:id', accessTokenValidator, catchError(updateDisputeController));
router.put('/:id/status', accessTokenValidator, catchError(updateStatusDisputeController));
router.put('/:id/cancel', accessTokenValidator, catchError(cancelDisputeController));
export default router;
