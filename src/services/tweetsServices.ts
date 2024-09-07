import db from '~/services/databaseServices';
import { TweetRequest, getTweetRequest } from '~/models/requests/TweetRequest';
import Tweet from '~/models/schemas/TweetSchema';
import { ObjectId } from 'mongodb';
import { GroupTypes, MemberStatus, TweetTypeEnum } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import Like from '~/models/schemas/LikeSchema';
import { LikeRequest } from '~/models/requests/LikeRequest';
import { DateVi } from '~/utils/date-vi';

class TweetsService {
  constructor() {}

  async createNewTweet(payload: TweetRequest) {
    const tweet = new Tweet({
      group_id: new ObjectId(payload.group_id),
      user_id: new ObjectId(payload.decodeAuthorization.payload.userId),
      type: payload.type,
      content: payload.content,
      parent_id: payload.parent_id ? new ObjectId(payload.parent_id) : null, //  chỉ null khi tweet gốc
      mentions: payload.mentions.map((tag) => new ObjectId(tag)),
      medias: payload.medias,
      views: 0
    });
    const createTweet = await db.tweets.insertOne(tweet);
    return createTweet.insertedId;
  }

  async increaseViews(payload: getTweetRequest) {
    const result = await db.tweets.findOneAndUpdate(
      { _id: new ObjectId(payload.tweet_id) },
      { $inc: { views: 1 }, $currentDate: { updated_at: true } },
      { returnDocument: 'after', projection: { views: 1, updated_at: 1 } }
    );
    return result;
  }

  async getTweet(payload: getTweetRequest) {
    const tweet = (
      await db.tweets
        .aggregate<any>([
          {
            $match: {
              _id: new ObjectId(payload.tweet_id)
            }
          },
          {
            $lookup: {
              from: 'Groups',
              localField: 'group_id',
              foreignField: '_id',
              as: 'group'
            }
          },
          {
            $lookup: {
              from: 'Users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    email: '$$mention.email',
                    username: '$$mention.username',
                    avatar: '$$mention.avatar'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'Likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'Tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_child'
            }
          },
          {
            $addFields: {
              bookmarks: {
                $size: '$bookmarks'
              },
              likes: {
                $size: '$likes'
              },
              retweet: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 1]
                    }
                  }
                }
              },
              comment: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', 2]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_child: 0
            }
          }
        ])
        .toArray()
    )[0];
    if (!tweet) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'Không tìm thấy tweet'
      });
    }
    const group_id = tweet.group_id;
    const group = await db.groups.findOne({ _id: group_id });
    if (!group) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'Không tìm thấy nhóm này'
      });
    }
    const isPrivate = group.type === GroupTypes.Private;
    if (isPrivate) {
      if (!payload.decodeAuthorization) {
        throw new ErrorWithStatus({
          message: 'Yêu cầu đăng nhập',
          status: httpStatus.UNAUTHORIZED
        });
      }
      const userGetTweet = payload.decodeAuthorization.payload.userId;
      const isMember = await db.members.findOne({ group_id: group_id, user_id: userGetTweet });
      if (!isMember || isMember.status !== MemberStatus.Accepted) {
        throw new ErrorWithStatus({
          status: httpStatus.UNAUTHORIZED,
          message: 'Bạn không có quyền truy cập'
        });
      }
    }
    return tweet;
  }

  async getTweetChildren(payload: getTweetRequest, tweet_type: TweetTypeEnum, limit: number, page: number) {
    const tweet = await db.tweets.findOne({ _id: new ObjectId(payload.tweet_id) });
    if (!tweet) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'Không tìm thấy bài viết'
      });
    }
    const group_id = tweet.group_id;
    const group = await db.groups.findOne({ _id: group_id });
    if (!group) {
      throw new ErrorWithStatus({
        status: httpStatus.NOT_FOUND,
        message: 'Không tìm thấy nhóm này'
      });
    }
    const isPrivate = group.type === GroupTypes.Private;
    if (isPrivate) {
      if (!payload.decodeAuthorization) {
        throw new ErrorWithStatus({
          message: 'Yêu cầu đăng nhập',
          status: httpStatus.UNAUTHORIZED
        });
      }
      const userGetTweet = new ObjectId(payload.decodeAuthorization.payload.userId);
      const isMember = await db.members.findOne({ group_id: group_id, user_id: userGetTweet });
      if (!isMember || isMember.status !== MemberStatus.Accepted) {
        throw new ErrorWithStatus({
          status: httpStatus.UNAUTHORIZED,
          message: 'Bạn không có quyền truy cập'
        });
      }
    }

    const result = await db.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(payload.tweet_id),
            type: tweet_type
          }
        },
        {
          $lookup: {
            from: 'Groups',
            localField: 'group_id',
            foreignField: '_id',
            as: 'group'
          }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  email: '$$mention.email',
                  username: '$$mention.username',
                  avatar: '$$mention.avatar'
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'Tweets',
            localField: '_id',
            foreignField: 'parent_id',
            as: 'tweet_child'
          }
        },
        {
          $addFields: {
            likes: {
              $size: '$likes'
            },
            retweet: {
              $size: {
                $filter: {
                  input: '$tweet_child',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetTypeEnum.Retweet]
                  }
                }
              }
            },
            comment: {
              $size: {
                $filter: {
                  input: '$tweet_child',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetTypeEnum.Comment]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_child: 0
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray();
    const ids = result.map((tweet) => tweet._id as ObjectId);
    const dateUpdate = DateVi();
    await db.tweets.updateMany(
      {
        _id: {
          $in: ids
        }
      },
      {
        $inc: { views: 1 },
        $set: { updated_at: dateUpdate }
      }
    );

    result.forEach((tweet) => {
      tweet.updated_at = dateUpdate;
      tweet.views += 1;
    });

    const total = await db.tweets.countDocuments({
      parent_id: new ObjectId(payload.tweet_id),
      type: tweet_type
    });

    return { total_page: Math.ceil(total / limit), result };
  }

  async getNewsFeed(userId: string, limit: number, page: number) {
    const listGroup = await db.members.find({ user_id: new ObjectId(userId) }).toArray();
    const listGroupId = listGroup
      .filter((member) => member.status === MemberStatus.Accepted)
      .map((item) => item.group_id);
    const [result, count] = await Promise.all([
      db.tweets
        .aggregate<Tweet>([
          {
            $match: {
              type: TweetTypeEnum.Tweet,
              group_id: {
                $in: listGroupId.map((groupId) => new ObjectId(groupId))
              }
            }
          },
          {
            $lookup: {
              from: 'Users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $lookup: {
              from: 'Groups',
              localField: 'group_id',
              foreignField: '_id',
              as: 'group'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },

          {
            $lookup: {
              from: 'Users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    email: '$$mention.email',
                    username: '$$mention.username',
                    avatar: '$$mention.avatar'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'Likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'Tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_child'
            }
          },
          {
            $addFields: {
              likes: {
                $size: '$likes'
              },
              retweet: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetTypeEnum.Retweet]
                    }
                  }
                }
              },
              comment: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetTypeEnum.Comment]
                    }
                  }
                }
              }
            }
          },
          {
            $sort: { created_at: -1 }
          },
          {
            $project: {
              tweet_child: 0,
              user: {
                password: 0,
                created_at: 0,
                forgot_password_token: 0,
                updated_at: 0
              }
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      db.tweets
        .aggregate([
          {
            $match: {
              group_id: {
                $in: listGroupId.map((groupId) => new ObjectId(groupId))
              }
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ]);
    const listTweetId = result.map((item) => item._id);
    const date = DateVi();
    await db.tweets.updateMany(
      {
        _id: { $in: listTweetId }
      },
      {
        $inc: { views: 1 },
        $set: { updated_at: date }
      }
    );
    result.forEach((item) => {
      (item.views += 1), (item.updated_at = date);
    });
    return { total_page: Math.ceil(count[0]?.total / limit), result };
  }

  async getPostsByGroupId(group_id: string, limit: number, page: number) {
    const listGroupId = [group_id];
    const [result, count] = await Promise.all([
      db.tweets
        .aggregate<Tweet>([
          {
            $match: {
              group_id: {
                $in: listGroupId.map((groupId) => new ObjectId(groupId))
              },
              type: TweetTypeEnum.Tweet
            }
          },
          {
            $lookup: {
              from: 'Users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $lookup: {
              from: 'Groups',
              localField: 'group_id',
              foreignField: '_id',
              as: 'group'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },

          {
            $lookup: {
              from: 'Users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              mentions: {
                $map: {
                  input: '$mentions',
                  as: 'mention',
                  in: {
                    _id: '$$mention._id',
                    name: '$$mention.name',
                    email: '$$mention.email',
                    username: '$$mention.username',
                    avatar: '$$mention.avatar'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'Likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'Tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_child'
            }
          },
          {
            $addFields: {
              likes: {
                $size: '$likes'
              },
              retweet: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetTypeEnum.Retweet]
                    }
                  }
                }
              },
              comment: {
                $size: {
                  $filter: {
                    input: '$tweet_child',
                    as: 'item',
                    cond: {
                      $eq: ['$$item.type', TweetTypeEnum.Comment]
                    }
                  }
                }
              }
            }
          },
          {
            $sort: { created_at: -1 }
          },
          {
            $project: {
              tweet_child: 0,
              user: {
                password: 0,
                created_at: 0,
                forgot_password_token: 0,
                updated_at: 0
              }
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      db.tweets
        .aggregate([
          {
            $match: {
              group_id: {
                $in: listGroupId.map((groupId) => new ObjectId(groupId))
              }
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ]);
    const listTweetId = result.map((item) => item._id);
    const date = DateVi();
    await db.tweets.updateMany(
      {
        _id: { $in: listTweetId }
      },
      {
        $inc: { views: 1 },
        $set: { updated_at: date }
      }
    );
    result.forEach((item) => {
      (item.views += 1), (item.updated_at = date);
    });
    return { total_page: Math.ceil(count[0]?.total / limit), result };
  }

  async like(payload: LikeRequest) {
    const checkInDb = await db.likes.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    if (checkInDb) {
      throw new ErrorWithStatus({
        message: 'Liked',
        status: httpStatus.BAD_REQUEST
      });
    }
    const like = new Like({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    const createLike = await db.likes.insertOne(like);
    return createLike.insertedId;
  }

  async unlike(payload: LikeRequest) {
    const checkInDb = await db.likes.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    if (!checkInDb) {
      throw new ErrorWithStatus({
        message: 'Chưa like trước đó',
        status: httpStatus.BAD_REQUEST
      });
    }
    const result = await db.likes.deleteOne({
      user_id: payload.decodeAuthorization.payload.userId,
      tweet_id: new ObjectId(payload.tweet_id)
    });
    return result.deletedCount;
  }
}

const tweetsService = new TweetsService();
export default tweetsService;
