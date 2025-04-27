import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { param } from 'express-validator';
import { ObjectId } from 'mongodb';
import path from 'path';
import { GroupTypes, MemberStatus, RoleType, TweetTypeEnum } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { LikeRequest } from '~/models/requests/LikeRequest';
import { TweetRequest, getTweetRequest } from '~/models/requests/TweetRequest';
import { Report } from '~/models/schemas/ReportSchema';
import db from '~/services/databaseServices';
import tweetsService from '~/services/tweetsServices';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequest>, res: Response) => {
  const result = await tweetsService.createNewTweet(req.body);
  res.status(200).json({
    message: result ? 'Bài viết đã được gửi chờ kiểm duyệt' : 'Đăng tải bài viết thành công'
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
  const censor = req.query.censor === 'true';
  const group_id = req.params.id;
  const user_id = req.body.decodeAuthorization.payload.userId;
  const isAdmin = req.body.decodeAuthorization.payload.role === RoleType.Admin;

  const { total_page, result } = await tweetsService.getPostsByGroupId(group_id, user_id, limit, page, censor, isAdmin);
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

export const approveTweetsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const tweet_id = req.params.id;
  await db.tweets.updateOne({ _id: new ObjectId(tweet_id) }, { $set: { censor: true } });
  res.status(200).json({
    message: 'Kiểm duyệt bài viết thành công'
  });
};

export const rejectTweetsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const tweet_id = req.params.id;
  await db.tweets.deleteOne({ _id: new ObjectId(tweet_id) });
  res.status(200).json({
    message: 'Từ chối bài viết thành công'
  });
};

export const createReportController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  await db.reports.insertOne(
    new Report({
      reporter: new ObjectId(req.body.decodeAuthorization.payload.userId),
      id_reported: new ObjectId(id),
      type: 'POST',
      description: req.body.description
    })
  );
  res.status(200).json({
    message: 'Báo cáo thành công'
  });
};

export const getReportsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    db.reports
      .aggregate([
        {
          $match: {
            type: 'POST'
          }
        },
        {
          $lookup: {
            from: 'Tweets',
            localField: 'id_reported',
            foreignField: '_id',
            as: 'tweet'
          }
        },
        {
          $unwind: '$tweet'
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'reporter',
            foreignField: '_id',
            as: 'reporter_info'
          }
        },
        {
          $unwind: '$reporter_info'
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'tweet.user_id',
            foreignField: '_id',
            as: 'tweet_author'
          }
        },
        {
          $unwind: '$tweet_author'
        },
        {
          $lookup: {
            from: 'Groups',
            localField: 'tweet.group_id',
            foreignField: '_id',
            as: 'group'
          }
        },
        {
          $unwind: '$group'
        },

        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray(),
    db.reports.countDocuments({ type: 'POST' })
  ]);

  const total_page = Math.ceil(total / limit);

  return res.status(200).json({
    message: 'Get reports success',
    result: reports,
    total_page,
    page,
    total
  });
};

export const rejectReportsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;

  // Delete the report
  await db.reports.deleteOne({ _id: new ObjectId(id) });

  return res.status(200).json({
    message: 'Từ chối đơn báo cáo thành công'
  });
};

export const approveReportsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;

  // Get report details to find tweet ID
  const report = await db.reports.findOne({ _id: new ObjectId(id) });
  if (!report) {
    throw new ErrorWithStatus({
      message: 'Không tồn tại đơn báo cáo này!',
      status: httpStatus.NOT_FOUND
    });
  }

  // Delete the reported tweet
  await db.tweets.deleteOne({ _id: report.id_reported });

  // Delete the report
  await db.reports.deleteOne({ _id: new ObjectId(id) });

  return res.status(200).json({
    message: 'Duyệt đơn báo cáo và xóa bài viết thành công'
  });
};

export const getMonthlyTweetStatisticsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { year } = req.query;

  // Validate year format
  if (!year || !/^\d{4}$/.test(year as string)) {
    throw new ErrorWithStatus({
      message: 'Định dạng năm không hợp lệ. Sử dụng định dạng YYYY',
      status: httpStatus.BAD_REQUEST
    });
  }

  const yearNum = parseInt(year as string);
  const startDate = new Date(yearNum, 0, 1); // January 1st of the year
  const endDate = new Date(yearNum, 11, 31, 23, 59, 59); // December 31st of the year

  const pipeline = [
    {
      $match: {
        created_at: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: { $month: '$created_at' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        count: 1
      }
    },
    {
      $sort: { month: 1 }
    }
  ];

  const statistics = await db.tweets.aggregate(pipeline).toArray();

  // Fill in missing months with zero counts
  const monthlyStats = Array.from({ length: 12 }, (_, i) => {
    const existingStat = statistics.find((stat) => stat.month === i + 1);
    return {
      month: i + 1,
      count: existingStat ? existingStat.count : 0
    };
  });

  return res.status(200).json({
    message: 'Lấy thống kê bài viết theo tháng thành công',
    result: monthlyStats
  });
};
