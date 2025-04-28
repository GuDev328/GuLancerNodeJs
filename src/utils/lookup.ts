import { StatusProject } from '~/constants/enum';

export const lookupUser = (localField: string, asName: string = 'user_info') => [
  {
    $lookup: {
      from: 'Users',
      localField: localField,
      foreignField: '_id',
      as: asName
    }
  },
  { $unwind: '$' + asName },
  {
    $lookup: {
      from: 'Evaluations',
      let: { userId: '$user_id' },
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
      let: { userId: '$user_id' },
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
      let: { userId: '$user_id' },
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
      [`${asName}.star`]: {
        $toDecimal: { $ifNull: [{ $arrayElemAt: ['$evaluations.averageStar', 0] }, 5.0] }
      },
      [`${asName}.evaluationCount`]: {
        $ifNull: [{ $arrayElemAt: ['$evaluations.evaluationCount', 0] }, 0]
      },
      [`${asName}.projectsDone`]: {
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
      adminProjects: 0
    }
  }
];
