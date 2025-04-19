import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { param } from 'express-validator';
import { ObjectId } from 'mongodb';
import path from 'path';
import { GroupTypes, MemberStatus, TweetTypeEnum } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { LikeRequest } from '~/models/requests/LikeRequest';
import { TweetRequest, getTweetRequest } from '~/models/requests/TweetRequest';
import db from '~/services/databaseServices';
import tweetsService from '~/services/tweetsServices';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const result = await tweetsService.createNewTweet(req.body);
  res.status(200).json({
    message: !result ? 'Bài viết đã được gửi chờ kiểm duyệt' : 'Đăng tải bài viết thành công'
  });
};

export const getTweetController = async (req: Request<ParamsDictionary, any, getTweetRequest>, res: Response) => {
  const viewUpdated = await tweetsService.increaseViews(req.body);
  const tweet = await tweetsService.getTweet(req.body);

  const result = {
    ...tweet,
    ...viewUpdated
  };
  res.status(200).json({
    result,
    message: 'Get tweet suscess'
  });
};

export const getTweetChildrenController = async (
  req: Request<ParamsDictionary, any, getTweetRequest>,
  res: Response
) => {
  const tweet_type = Number(req.query.tweet_type as string) as TweetTypeEnum;
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const { total_page, result } = await tweetsService.getTweetChildren(req.body, tweet_type, limit, page);
  res.status(200).json({
    result,
    total_page,
    page,
    limit,
    tweet_type,
    message: 'Get tweet children suscess'
  });
};

export const getNewsFeedController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const userId = req.body.decodeAuthorization.payload.userId;
  const { total_page, result } = await tweetsService.getNewsFeed(userId, limit, page);
  res.status(200).json({
    result,
    total_page,
    page,
    limit,
    message: 'Get news feed suscess'
  });
};

export const getPostsByGroupIdController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const group_id = req.params.id;
  const user_id = req.body.decodeAuthorization.payload.userId;
  const { total_page, result } = await tweetsService.getPostsByGroupId(group_id, user_id, limit, page);
  res.status(200).json({
    result,
    total_page,
    page,
    limit,
    message: 'Get news feed suscess'
  });
};
export const likeController = async (req: Request<ParamsDictionary, any, LikeRequest>, res: Response) => {
  await tweetsService.like(req.body);
  res.status(200).json({
    message: 'Like suscess'
  });
};

export const unlikeController = async (req: Request<ParamsDictionary, any, LikeRequest>, res: Response) => {
  await tweetsService.unlike(req.body);
  res.status(200).json({
    message: 'Unlike suscess'
  });
};
