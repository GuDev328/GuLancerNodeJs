import { ObjectId } from 'mongodb';
import { MemberStatus, RoleType, StatusProject, TweetTypeEnum, VerifyStatus } from '~/constants/enum';
import db from './databaseServices';
import Tweet from '~/models/schemas/TweetSchema';
import { DateVi } from '~/utils/date-vi';
import { FreelancerOrderByO, SearchFreelancerRequest } from '~/models/requests/SearchRequest';

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
              member_count: {
                $size: {
                  $filter: {
                    input: '$members',
                    as: 'member',
                    cond: { $eq: ['$$member.status', MemberStatus.Accepted] }
                  }
                }
              }
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
            $lookup: {
              from: 'Evaluations',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$user_id', '$$userId'] }
                  }
                },
                {
                  $group: {
                    _id: null,
                    averageStar: { $avg: '$star' },
                    evaluationCount: { $sum: 1 }
                  }
                }
              ],
              as: 'evaluations'
            }
          },
          {
            $lookup: {
              from: 'Projects',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ['$user_id', '$$userId'] }, { $eq: ['$status', StatusProject.Complete] }]
                    }
                  }
                },
                {
                  $group: {
                    _id: null,
                    adminProjectsDone: { $sum: 1 }
                  }
                }
              ],
              as: 'adminProjects'
            }
          },
          {
            $lookup: {
              from: 'MemberProject',
              let: { userId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$user_id', '$$userId'] }
                  }
                },
                {
                  $lookup: {
                    from: 'Projects',
                    localField: 'project_id',
                    foreignField: '_id',
                    as: 'project'
                  }
                },
                {
                  $unwind: '$project'
                },
                {
                  $match: {
                    'project.status': StatusProject.Complete
                  }
                },
                {
                  $group: {
                    _id: null,
                    memberProjectsDone: { $sum: 1 }
                  }
                }
              ],
              as: 'memberProjects'
            }
          },
          {
            $addFields: {
              [`star`]: {
                $toDecimal: { $ifNull: [{ $arrayElemAt: ['$evaluations.averageStar', 0] }, 0.0] }
              },
              [`evaluationCount`]: {
                $ifNull: [{ $arrayElemAt: ['$evaluations.evaluationCount', 0] }, 0]
              },
              [`projectsDone`]: {
                $add: [
                  { $ifNull: [{ $arrayElemAt: ['$adminProjects.adminProjectsDone', 0] }, 0] },
                  { $ifNull: [{ $arrayElemAt: ['$memberProjects.memberProjectsDone', 0] }, 0] }
                ]
              }
            }
          },

          {
            $project: {
              evaluations: 0,
              memberProjects: 0,
              adminProjects: 0,
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

  async searchFreelancer(payload: SearchFreelancerRequest, limit: number, page: number) {
    const regexKey = payload.key ? new RegExp(payload.key, 'i') : null;
    let fieldsId = payload.fields?.map((field) => new ObjectId(field)) || [];
    let techsId = payload.technologies?.map((tech) => new ObjectId(tech)) || [];

    if (fieldsId.length === 0 && regexKey) {
      const res = await db.fields.find({ name: regexKey }).toArray();
      fieldsId = res.map((field) => new ObjectId(field._id));
    }
    if (techsId.length === 0 && regexKey) {
      const res = await db.technologies.find({ name: regexKey }).toArray();
      techsId = res.map((tech) => new ObjectId(tech._id));
    }

    const sortField =
      payload.orderBy === FreelancerOrderByO.Salary
        ? { salary: -1 }
        : payload.orderBy === FreelancerOrderByO.Star
          ? { star: -1 }
          : payload.orderBy === FreelancerOrderByO.ProjectDone
            ? { projectsDone: -1 }
            : { created_at: -1 };

    const commonQuery = [
      {
        $match: {
          ...(typeof payload.verified !== 'undefined'
            ? {
                'verified_info.status': payload.verified ? VerifyStatus.Approved : { $ne: VerifyStatus.Approved }
              }
            : {})
        }
      },
      {
        $lookup: {
          from: 'Technologies',
          localField: 'technologies',
          foreignField: '_id',
          as: 'technologies_info'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'fields',
          foreignField: '_id',
          as: 'fields_info'
        }
      },

      {
        $lookup: {
          from: 'Evaluations',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$userId'] }
              }
            },
            {
              $group: {
                _id: null,
                averageStar: { $avg: '$star' },
                evaluationCount: { $sum: 1 }
              }
            }
          ],
          as: 'evaluations'
        }
      },
      {
        $lookup: {
          from: 'MemberProject',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user_id', '$$userId'] }
              }
            },
            {
              $lookup: {
                from: 'Projects',
                localField: 'project_id',
                foreignField: '_id',
                as: 'project'
              }
            },
            {
              $unwind: '$project'
            },
            {
              $match: {
                'project.status': StatusProject.Complete
              }
            },
            {
              $group: {
                _id: null,
                projectsDone: { $sum: 1 }
              }
            }
          ],
          as: 'memberProjects'
        }
      },
      {
        $addFields: {
          [`star`]: {
            $toDecimal: { $ifNull: [{ $arrayElemAt: ['$evaluations.averageStar', 0] }, 0.0] }
          },
          [`evaluationCount`]: {
            $ifNull: [{ $arrayElemAt: ['$evaluations.evaluationCount', 0] }, 0]
          },
          [`projectsDone`]: {
            $ifNull: [{ $arrayElemAt: ['$memberProjects.projectsDone', 0] }, 0]
          }
        }
      },
      {
        $project: {
          evaluations: 0,
          memberProjects: 0
        }
      },
      {
        $sort: sortField
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
        }
      },
      {
        $addFields: {
          metadata: {
            $arrayElemAt: ['$metadata', 0]
          }
        }
      },
      {
        $addFields: {
          total_page: {
            $ceil: { $divide: ['$metadata.total', limit] }
          },
          page: page
        }
      }
    ];

    const queryNoTechField = [
      {
        $match: {
          $and: [
            {
              $or: [
                regexKey ? { $or: [{ name: regexKey }, { username: regexKey }] } : {},
                fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null,
                techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null
              ].filter(Boolean)
            },
            {
              role: RoleType.Freelancer
            },
            {
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },
      ...commonQuery
    ];

    const queryHasTech = [
      {
        $match: {
          $and: [
            {
              $or: [
                regexKey ? { $or: [{ name: regexKey }, { username: regexKey }] } : {},
                fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null
              ].filter(Boolean)
            },
            {
              role: RoleType.Freelancer
            },
            {
              ...(techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },

      ...commonQuery
    ];

    const queryHasField = [
      {
        $match: {
          $and: [
            {
              $or: [
                regexKey ? { $or: [{ name: regexKey }, { username: regexKey }] } : {},
                techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null
              ].filter(Boolean)
            },
            {
              role: RoleType.Freelancer
            },
            {
              ...(fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },
      ...commonQuery
    ];

    const queryHasTechField = [
      {
        $match: {
          $and: [
            {
              ...(regexKey ? { $or: [{ name: regexKey }, { username: regexKey }] } : {}),
              ...(fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null),
              ...(techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            },
            {
              role: RoleType.Freelancer
            }
          ]
        }
      },
      ...commonQuery
    ];

    const query =
      payload.fields?.length && payload.technologies?.length
        ? queryHasTechField
        : payload.fields?.length
          ? queryHasField
          : payload.technologies?.length
            ? queryHasTech
            : queryNoTechField;
    const result = await db.users.aggregate(query).toArray();

    const response = {
      page: result[0]?.page || 1,
      total_page: result[0]?.total_page || 0,
      limit: limit,
      data: result[0]?.data || []
    };
    return response;
  }
}

const searchServices = new SearchServices();
export default searchServices;
