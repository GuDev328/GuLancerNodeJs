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
            averageStar: { $avg: '$star' }
          }
        }
      ],
      as: 'evaluations'
    }
  },
  {
    $addFields: {
      [`${asName}.star`]: {
        $ifNull: [{ $arrayElemAt: ['$evaluations.averageStar', 0] }, 5]
      }
    }
  },
  {
    $project: {
      evaluations: 0
    }
  }
];
