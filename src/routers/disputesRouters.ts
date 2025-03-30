import { Router } from 'express';
import {
  createDisputeController,
  updateDisputeController,
  getDisputeByIdController,
  cancelDisputeController,
  updateDisputeStatusController,
  getListDisputeController,
  notPayDisputeController,
  payOneDisputeController,
  payAllDisputeController
} from '~/controllers/disputesControllers';
import { accessTokenValidator, isAdminValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/', accessTokenValidator, catchError(createDisputeController));
router.get('/:id', accessTokenValidator, catchError(getDisputeByIdController));
router.put('/:id', accessTokenValidator, catchError(updateDisputeController));
router.put('/:id/status', accessTokenValidator, catchError(updateDisputeStatusController));
router.put('/:id/cancel', accessTokenValidator, catchError(cancelDisputeController));
router.post('/list', accessTokenValidator, isAdminValidator, catchError(getListDisputeController));

router.post('/:id/pay-all', accessTokenValidator, isAdminValidator, catchError(payAllDisputeController));
router.post('/:id/pay-part', accessTokenValidator, isAdminValidator, catchError(payOneDisputeController));
router.post('/:id/not-pay', accessTokenValidator, isAdminValidator, catchError(notPayDisputeController));

export default router;
