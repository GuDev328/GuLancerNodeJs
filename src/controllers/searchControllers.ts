import { Request, Response } from 'express';
import searchServices from '~/services/searchServices';

export const searchCommunityController = async (req: Request, res: Response) => {
  const userId = req.body.decodeAuthorization.payload.userId;
  const key = req.query.key as string;
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const result = await searchServices.searchCommunity(userId, key, limit, page);
  res.status(200).json({
    result,
    message: 'Search suscess'
  });
};
