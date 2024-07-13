import { ObjectId } from 'mongodb';
import { TweetTypeEnum } from '~/constants/enum';
import db from './databaseServices';
import Tweet from '~/models/schemas/TweetSchema';

class SearchServices {
  constructor() {}
  async searchCommunity(userId: string, key: string, limit: number, page: number) {
    const regexPattern = new RegExp(key, 'i');
    const listGroup = await db.members.find({ user_id: new ObjectId(userId) }).toArray();
    const listGroupId = listGroup.map((item) => item.group_id);
    const [resultTweet, countTweet, resultUser, countUser] = await Promise.all([
      db.tweets
        .aggregate<Tweet>([
          {
            $match: {
              $text: {
                $search: key
              }
            }
          },
          {
            $match: {
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
            $project: {
              tweet_child: 0,
              user: {
                password: 0,
                created_at: 0,
                emailVerifyToken: 0,
                forgot_password_token: 0,
                updated_at: 0,
                twitter_circle: 0
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
              $text: {
                $search: key
              }
            }
          },
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
        .toArray(),
      db.users
        .aggregate([
          {
            $match: {
              username: {
                $regex: key,
                $options: 'i'
              }
            }
          },
          {
            $project: {
              password: 0,
              created_at: 0,
              emailVerifyToken: 0,
              forgot_password_token: 0,
              updated_at: 0,
              twitter_circle: 0
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
      db.users.countDocuments({ username: { $regex: regexPattern } })
    ]);

    const listTweetId = resultTweet.map((item) => item._id);
    const date = new Date();
    await db.tweets.updateMany(
      {
        _id: { $in: listTweetId }
      },
      {
        $inc: { views: 1 },
        $set: { updated_at: date }
      }
    );
    resultTweet.forEach((item) => {
      (item.views += 1), (item.updated_at = date);
    });

    return {
      tweets: { total_page: Math.ceil(countTweet[0]?.total / limit), resultTweet },
      users: { total_page: Math.ceil(countUser / limit), resultUser }
    };
  }
}

const searchServices = new SearchServices();
export default searchServices;
