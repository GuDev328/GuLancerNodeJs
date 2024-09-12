import { ObjectId } from 'mongodb';
import { TweetTypeEnum } from '~/constants/enum';
import db from './databaseServices';
import Tweet from '~/models/schemas/TweetSchema';
import { DateVi } from '~/utils/date-vi';

class SearchServices {
  constructor() {}
  async searchCommunity(userId: string, key: string, limit: number, page: number) {
    const regexPattern = new RegExp(key, 'i');
    const [resultGroup, countGroup, resultUser, countUser] = await Promise.all([
      db.groups
        .aggregate([
          {
            $match: {
              name: { $regex: regexPattern }
            }
          },
          {
            $lookup: {
              from: 'Members',
              localField: '_id',
              foreignField: 'group_id',
              as: 'members'
            }
          },
          {
            $addFields: {
              statusMember: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: '$members',
                              as: 'member',
                              cond: { $eq: ['$$member.user_id', new ObjectId(userId)] }
                            }
                          },
                          as: 'filteredMember',
                          in: '$$filteredMember.status'
                        }
                      },
                      0
                    ]
                  },
                  10 // Nếu không có bản ghi phù hợp, mặc định là 10
                ]
              },
              member_count: { $size: '$members' }
            }
          },
          {
            $project: {
              members: 0
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
      db.groups.countDocuments({
        name: { $regex: regexPattern }
      }),
      db.users
        .aggregate([
          {
            $match: {
              $or: [{ username: { $regex: regexPattern } }, { name: { $regex: regexPattern } }]
            }
          },
          {
            $lookup: {
              from: 'Followers',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$user_id', new ObjectId(userId)] }, { $eq: ['$followed_user_id', '$$userId'] }]
                    }
                  }
                }
              ],
              as: 'isFollowed'
            }
          },
          {
            $addFields: {
              isFollowed: { $cond: { if: { $gt: [{ $size: '$isFollowed' }, 0] }, then: true, else: false } }
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

      db.users.countDocuments({
        $or: [{ username: { $regex: regexPattern } }, { name: { $regex: regexPattern } }]
      })
    ]);

    return {
      groups: { total_page: Math.ceil(countGroup / limit), page, limit, resultGroup },
      users: { total_page: Math.ceil(countUser / limit), page, limit, resultUser }
    };
  }
}

const searchServices = new SearchServices();
export default searchServices;
