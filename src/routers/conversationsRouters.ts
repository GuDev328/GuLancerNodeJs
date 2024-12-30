import { Router } from 'express';
import {
  addNewConversationController,
  getChatUsersController,
  getConversationController,
  getProjectConversationController,
  removeConversationController
} from '~/controllers/conversationsControllers';
import { accessTokenValidator } from '~/middlewares/usersMiddlewares';
import { catchError } from '~/utils/handler';
const router = Router();

router.get('/get-conversation/:receiverUserId', accessTokenValidator, catchError(getConversationController));
router.get('/get-project-conversation/:projectId', accessTokenValidator, catchError(getProjectConversationController));
router.get('/get-chat-users', accessTokenValidator, catchError(getChatUsersController));
router.post('/add-new-conversation', accessTokenValidator, catchError(addNewConversationController));
router.post('/remove-conversation', accessTokenValidator, catchError(removeConversationController));
export default router;
