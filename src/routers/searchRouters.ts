import { Router } from 'express';
import { searchCommunityController } from '~/controllers/searchControllers';
import { searchValidator } from '~/middlewares/searchMiddlewares';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
const router = Router();

router.get('/community', searchValidator, accessTokenValidator, searchCommunityController);

export default router;
