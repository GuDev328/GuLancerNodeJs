import { Router } from 'express';
import { createPaymentController } from '~/controllers/paymentController';
import { searchCommunityController, searchFreelancerController } from '~/controllers/searchControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/create-payment', accessTokenValidator, catchError(createPaymentController));

export default router;
