import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import conversationsService from '~/services/conversationsServices';

export const getConversationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const receiverUserId = req.params.receiverUserId;
  const senderId = req.body.decodeAuthorization.payload.userId;
  const limit = Number(req.query.limit as string);
  const pageInput = Number(req.query.page as string);
  const { result, page, total_page } = await conversationsService.getConversation(
    senderId,
    receiverUserId,
    limit,
    pageInput
  );
  res.status(200).json({
    result,
    page,
    total_page,
    message: 'Get conversation suscess'
  });
};

export const getChatUsersController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = req.body.decodeAuthorization.payload.userId;
  const limit = Number(req.query.limit as string);
  const pageInput = Number(req.query.page as string);
  const { result, page, total_page } = await conversationsService.getChatUsers(userId, limit, pageInput);
  res.status(200).json({
    result,
    page,
    total_page,
    message: 'Get chat users suscess'
  });
};

export const addNewConversationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const senderId = req.body.decodeAuthorization.payload.userId;
  const receiverId = req.body.user_id;
  const newConversation = await conversationsService.addNewConversation(senderId, receiverId);
  res.status(200).json({
    newConversation,
    message: 'Add new conversation suscess'
  });
};

export const removeConversationController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const senderId = req.body.decodeAuthorization.payload.userId;
  const receiverId = req.body.user_id;
  const newConversation = await conversationsService.removeConversation(senderId, receiverId);
  res.status(200).json({
    newConversation,
    message: 'Remove conversation suscess'
  });
};
