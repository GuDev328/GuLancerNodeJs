import { Router } from 'express';
import {
  createDisputeController,
  updateDisputeController,
  getDisputeByIdController,
  cancelDisputeController,
  updateDisputeStatusController
} from '~/controllers/disputesControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.post('/', accessTokenValidator, catchError(createDisputeController));
router.get('/:id', accessTokenValidator, catchError(getDisputeByIdController));
router.put('/:id', accessTokenValidator, catchError(updateDisputeController));
router.put('/:id/status', accessTokenValidator, catchError(updateDisputeStatusController));
router.put('/:id/cancel', accessTokenValidator, catchError(cancelDisputeController));
export default router;
