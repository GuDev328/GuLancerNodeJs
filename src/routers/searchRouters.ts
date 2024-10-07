import { Router } from 'express';
import { searchCommunityController, searchFreelancerController } from '~/controllers/searchControllers';
import { searchValidator } from '~/middlewares/searchMiddlewares';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
const router = Router();

router.get('/community', searchValidator, accessTokenValidator, searchCommunityController);
router.post('/freelancer', accessTokenValidator, searchFreelancerController);
export default router;
