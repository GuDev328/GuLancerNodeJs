import { ParamsDictionary } from 'express-serve-static-core';
import { Request, Response } from 'express';
import searchServices from '~/services/searchServices';
import { SearchFreelancerRequest } from '~/models/requests/SearchRequest';

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

export const searchFreelancerController = async (
  req: Request<ParamsDictionary, any, SearchFreelancerRequest>,
  res: Response
) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const result = await searchServices.searchFreelancer(req.body, limit, page);
  res.status(200).json({
    result,
    message: 'Search suscess'
  });
};
