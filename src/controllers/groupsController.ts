import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { MemberStatus } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { CreateGroupRequest, DecodeAuthorization, EditGroupRequest, GroupID } from '~/models/requests/GroupRequest';
import { Report } from '~/models/schemas/ReportSchema';
import db from '~/services/databaseServices';
import groupsService from '~/services/groupsServices';

export const createGroupController = async (req: Request<ParamsDictionary, any, CreateGroupRequest>, res: Response) => {
  await groupsService.createGroup(req.body);
  res.status(200).json({
    message: 'Create group suscess'
  });
};

export const editGroupController = async (req: Request<ParamsDictionary, any, EditGroupRequest>, res: Response) => {
  await groupsService.editGroup(req.body);
  res.status(200).json({
    message: 'Cập nhật thông tin thành công.'
  });
};

export const getMembersController = async (req: Request<ParamsDictionary, any, GroupID>, res: Response) => {
  const group_id = new ObjectId(req.params.id);
  const { page, limit, status } = req.query;
  const result = await groupsService.getMembers(group_id, Number(page), Number(limit), Number(status));
  res.status(200).json({
    result,
    message: 'Lấy danh sách thành viên thành công'
  });
};

export const getMyGroupsController = async (
  req: Request<ParamsDictionary, any, DecodeAuthorization>,
  res: Response
) => {
  const result = await groupsService.getMyGroups(req.body);
  res.status(200).json({
    result,
    message: 'Lấy danh sách nhóm thành công'
  });
};

export const getGroupByIdController = async (
  req: Request<ParamsDictionary, any, DecodeAuthorization>,
  res: Response
) => {
  const { id } = req.params;
  const group_id = new ObjectId(id);
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await groupsService.getGroupById(group_id, user_id);
  res.status(200).json({
    result,
    message: 'Lấy thông tin nhóm thành công'
  });
};

export const handlePendingMemberController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const member_id = new ObjectId(req.body.id);
  const status = Number(req.body.status);
  if (status === MemberStatus.Rejected) {
    db.members.deleteOne({ _id: member_id });
  } else {
    db.members.updateOne({ _id: member_id }, { $set: { status } });
  }
  res.status(200).json({
    message: 'Thành công'
  });
};

export const joinGroupController = async (req: Request<ParamsDictionary, any, GroupID>, res: Response) => {
  const group_id = new ObjectId(req.body.group_id);
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await groupsService.joinGroup(group_id, user_id);
  res.status(200).json({
    result,
    message: 'Join nhóm thành công'
  });
};

export const leaveGroupController = async (req: Request<ParamsDictionary, any, GroupID>, res: Response) => {
  const group_id = new ObjectId(req.params.id);
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await db.members.deleteOne({ group_id, user_id });
  res.status(200).json({
    result,
    message: 'Rời cộng đồng thành công'
  });
};

export const deleteGroupController = async (req: Request<ParamsDictionary, any, GroupID>, res: Response) => {
  const group_id = new ObjectId(req.params.id);
  await db.groups.deleteOne({ _id: group_id });
  db.tweets.deleteMany({ group_id });
  db.members.deleteMany({ group_id });
  res.status(200).json({
    message: 'Xóa nhóm thành công'
  });
};

export const createReportController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  await db.reports.insertOne(
    new Report({
      reporter: new ObjectId(req.body.decodeAuthorization.payload.userId),
      id_reported: new ObjectId(id),
      type: 'GROUP',
      description: req.body.description
    })
  );
  res.status(200).json({
    message: 'Báo cáo thành công'
  });
};

export const getGroupReportsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    db.reports
      .aggregate([
        {
          $match: {
            type: 'GROUP'
          }
        },
        {
          $lookup: {
            from: 'Groups',
            localField: 'id_reported',
            foreignField: '_id',
            as: 'group'
          }
        },
        {
          $unwind: '$group'
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
            localField: 'group.admin_id',
            foreignField: '_id',
            as: 'admin_info'
          }
        },

        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray(),
    db.reports.countDocuments({ type: 'GROUP' })
  ]);

  const total_page = Math.ceil(total / limit);

  return res.status(200).json({
    message: 'Lấy danh sách báo cáo nhóm thành công',
    result: reports,
    total_page,
    page,
    total
  });
};

export const rejectGroupReportController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;

  // Delete the report
  await db.reports.deleteOne({ _id: new ObjectId(id) });

  return res.status(200).json({
    message: 'Từ chối đơn báo cáo nhóm thành công'
  });
};

export const approveGroupReportController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;

  // Get report details to find group ID
  const report = await db.reports.findOne({ _id: new ObjectId(id) });
  if (!report) {
    throw new ErrorWithStatus({
      message: 'Không tồn tại đơn báo cáo này!',
      status: httpStatus.NOT_FOUND
    });
  }

  // Delete all group members
  db.members.deleteMany({ group_id: report.id_reported });

  // Delete all tweets in group
  db.tweets.deleteMany({ group_id: report.id_reported });

  // Delete the group
  db.groups.deleteOne({ _id: report.id_reported });
  // Delete the report
  db.reports.deleteOne({ _id: new ObjectId(id) });
  return res.status(200).json({
    message: 'Duyệt đơn báo cáo và xóa nhóm thành công'
  });
};

export const getGroupsListController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search_key = (req.query.search_key as string) || '';
  const sort_by = (req.query.sort_by as string) || 'created_at';
  const order_by = (req.query.order_by as string) || 'desc';
  const skip = (page - 1) * limit;

  // Build search condition
  const searchRegex = new RegExp(search_key, 'i');
  const searchCondition = search_key
    ? {
        $or: [{ name: searchRegex }, { 'admin_info.name': searchRegex }]
      }
    : {};

  // Build sort condition
  const sortCondition: any = {};
  if (sort_by === 'members_count') {
    sortCondition.members_count = order_by === 'desc' ? -1 : 1;
  } else if (sort_by === 'posts_count') {
    sortCondition.posts_count = order_by === 'desc' ? -1 : 1;
  } else {
    sortCondition.created_at = order_by === 'desc' ? -1 : 1;
  }
  const [groups, total] = await Promise.all([
    db.groups
      .aggregate([
        {
          $lookup: {
            from: 'Users',
            localField: 'admin_id',
            foreignField: '_id',
            as: 'admin_info'
          }
        },
        {
          $lookup: {
            from: 'Members',
            localField: '_id',
            foreignField: 'group_id',
            pipeline: [
              {
                $match: {
                  status: MemberStatus.Accepted
                }
              }
            ],
            as: 'members'
          }
        },
        {
          $lookup: {
            from: 'Tweets',
            localField: '_id',
            foreignField: 'group_id',
            as: 'posts'
          }
        },
        {
          $addFields: {
            members_count: { $size: '$members' },
            posts_count: { $size: '$posts' }
          }
        },
        {
          $match: searchCondition
        },

        {
          $sort: sortCondition
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray(),
    db.groups.countDocuments(searchCondition)
  ]);

  const total_page = Math.ceil(total / limit);

  return res.status(200).json({
    message: 'Lấy danh sách nhóm thành công',
    result: groups,
    total_page,
    page,
    total
  });
};

export const getTopGroupsStatisticsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { type = 'posts' } = req.query; // 'posts' or 'members'

  if (!['posts', 'members'].includes(type as string)) {
    throw new ErrorWithStatus({
      message: 'Loại thống kê không hợp lệ. Sử dụng "posts" hoặc "members"',
      status: httpStatus.BAD_REQUEST
    });
  }

  const pipeline = [
    {
      $lookup:
        type === 'posts'
          ? {
              from: 'Tweets',
              localField: '_id',
              foreignField: 'group_id',
              as: 'posts'
            }
          : {
              from: 'Members',
              localField: '_id',
              foreignField: 'group_id',
              as: 'members'
            }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        count: type === 'posts' ? { $size: '$posts' } : { $size: '$members' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const statistics = await db.groups.aggregate(pipeline).toArray();

  // Get top 5 and calculate others
  const top5 = statistics.slice(0, 5);
  const totalCount = statistics.reduce((sum, item) => sum + item.count, 0);
  const top5Count = top5.reduce((sum, item) => sum + item.count, 0);
  const othersCount = totalCount - top5Count;

  const result = [
    ...top5,
    ...(othersCount > 0
      ? [
          {
            _id: 'others',
            name: 'Khác',
            count: othersCount
          }
        ]
      : [])
  ];

  return res.status(200).json({
    message: `Lấy thống kê top cộng đồng theo ${type === 'posts' ? 'số bài viết' : 'số thành viên'} thành công`,
    result
  });
};
