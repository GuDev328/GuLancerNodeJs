import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import {
  AcceptApplyInviteRequest,
  ApplyInviteRequest,
  BookmarkRequest,
  CreateProjectRequest,
  GetAllProjectRequest,
  GetApplyInviteRequest,
  GetMyProjectsRequest
} from '~/models/requests/ProjectRequest';
import Bookmark from '~/models/schemas/BookmarkSchema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import Project from '~/models/schemas/ProjectSchema';
import { InvitationType, ProjectOrderBy, RoleMemberProject, StatusProject } from '~/constants/enum';
import Field from '~/models/schemas/FieldSchema';
import Technology from '~/models/schemas/TechnologySchema';
import ApplyInvitation from '~/models/schemas/ApplyInvitation';

class ProjectsService {
  constructor() {}

  async createProject(payload: CreateProjectRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const fieldsFinds = await Promise.all(
      payload.fields.map(async (field) => {
        const fieldFind = await db.fields.findOne<Field>({ name: field });
        if (!fieldFind) {
          const init = await db.fields.insertOne(new Field({ name: field }));
          return new ObjectId(init.insertedId);
        } else {
          return fieldFind._id;
        }
      })
    );
    const techsFinds = await Promise.all(
      payload.technologys.map(async (tech) => {
        const techFind = await db.technologies.findOne<Technology>({ name: tech });
        if (!techFind) {
          const init = await db.technologies.insertOne(new Technology({ name: tech }));
          return new ObjectId(init.insertedId);
        } else {
          return new ObjectId(techFind._id);
        }
      })
    );
    const project = new Project({
      title: payload.title,
      status: StatusProject.NotReady,
      admin_id: user_id,
      max_member: 1,
      members: [],
      salary: Number(payload.salary),
      salaryType: payload.salaryType,
      description: payload.description,
      technologys: techsFinds,
      fields: fieldsFinds
    });

    return await db.projects.insertOne(project);
  }

  async bookmark(payload: BookmarkRequest) {
    const checkInDb = await db.bookmarks.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    if (checkInDb) {
      throw new ErrorWithStatus({
        message: 'Bookmark đã được thêm',
        status: httpStatus.BAD_REQUEST
      });
    }
    const bookmark = new Bookmark({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    const createBookmark = await db.bookmarks.insertOne(bookmark);
    return createBookmark.insertedId;
  }

  async unbookmark(payload: BookmarkRequest) {
    const checkInDb = await db.bookmarks.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    if (!checkInDb) {
      throw new ErrorWithStatus({
        message: 'Bookmark không tồn tại',
        status: httpStatus.BAD_REQUEST
      });
    }
    const result = await db.bookmarks.deleteOne({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    return result.deletedCount;
  }

  async getAll(page: number, limit: number, payload: GetAllProjectRequest) {
    const regexKey = payload.key ? new RegExp(payload.key, 'i') : null;
    let fieldsId = payload.fields?.map((field) => new ObjectId(field)) || [];
    let techsId = payload.technologys?.map((tech) => new ObjectId(tech)) || [];

    if (fieldsId.length === 0 && regexKey) {
      const res = await db.fields.find({ name: regexKey }).toArray();
      fieldsId = res.map((field) => new ObjectId(field._id));
    }
    if (techsId.length === 0 && regexKey) {
      const res = await db.technologies.find({ name: regexKey }).toArray();
      techsId = res.map((tech) => new ObjectId(tech._id));
    }

    const sortField =
      payload.orderBy === ProjectOrderBy.CreatedAt
        ? { created_at: -1 }
        : payload.orderBy === ProjectOrderBy.Salary
          ? { salary: -1 }
          : payload.orderBy === ProjectOrderBy.StarEmployer
            ? { 'user.star': -1 }
            : payload.orderBy === ProjectOrderBy.ProjectDoneEmployer
              ? { 'user.project_done': -1 }
              : { created_at: -1 };

    const commonQuery = [
      {
        $lookup: {
          from: 'Users',
          localField: 'admin_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'Technologies',
          localField: 'technologys',
          foreignField: '_id',
          as: 'technologies_info'
        }
      },
      {
        $lookup: {
          from: 'Users',
          localField: 'members_id',
          foreignField: '_id',
          as: 'members_info'
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
        $sort: sortField // Thêm bước sắp xếp dựa trên `payload.orderBy`
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            //{ $sort: { salary: -1 } }, // Sắp xếp theo lương giảm dần
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ]
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
                regexKey ? { title: regexKey } : {},
                fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null,
                techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null
              ].filter(Boolean)
            },
            {
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
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
                regexKey ? { title: regexKey } : {},
                fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null
              ].filter(Boolean)
            },
            {
              ...(techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null),
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
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
                regexKey ? { title: regexKey } : {},

                techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null
              ].filter(Boolean)
            },
            {
              ...(fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null),
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
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
              ...(regexKey ? { title: regexKey } : {}),
              ...(fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null),
              ...(techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null),
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
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

    const query =
      payload.fields?.length && payload.technologys?.length
        ? queryHasTechField
        : payload.fields?.length
          ? queryHasField
          : payload.technologys?.length
            ? queryHasTech
            : queryNoTechField;
    const result = await db.projects.aggregate(query).toArray();

    const response = {
      page: result[0]?.page || 1,
      total_page: result[0]?.total_page || 0,
      limit: limit,
      data: result[0]?.data || []
    };
    return response;
  }

  async applyInvite(payload: ApplyInviteRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const project_id = new ObjectId(payload.project_id);

    const project = await db.projects.findOne({
      _id: project_id
    });
    if (!project) {
      throw new ErrorWithStatus({
        message: 'Dự án không tồn tại',
        code: 'PROJECT_NOT_FOUND',
        status: httpStatus.BAD_REQUEST
      });
    }

    project.members.map((member) => {
      if (member._id.equals(user_id)) {
        throw new ErrorWithStatus({
          message: 'Bạn đã là thành viên của dự án này',
          code: 'ALREADY_MEMBER',
          status: httpStatus.BAD_REQUEST
        });
      }
    });

    const findInDb = await db.applyInvitations.findOne({
      user_id,
      project_id
    });
    if (findInDb) {
      throw new ErrorWithStatus({
        message: 'Bạn đã gửi lời mời cho dự án này',
        code: 'APPLY_INVITE_EXIST',
        status: httpStatus.BAD_REQUEST
      });
    }
    const applyInvite = new ApplyInvitation({
      user_id,
      project_id,
      type: payload.type,
      content: payload.content,
      salary: payload.salary,
      time_to_complete: payload.time_to_complete ? new Date(payload.time_to_complete) : null
    });
    return await db.applyInvitations.insertOne(applyInvite);
  }

  async acceptApplyInvite(payload: AcceptApplyInviteRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const apply_invite_id = new ObjectId(payload.apply_invite_id);

    const applyInvite = await db.applyInvitations.findOne({
      _id: apply_invite_id
    });
    if (!applyInvite) {
      throw new ErrorWithStatus({
        message: 'Invite không tồn tại',
        code: 'APPLY_INVITE_NOT_FOUND',
        status: httpStatus.BAD_REQUEST
      });
    }

    if (applyInvite.type === InvitationType.Apply) {
      const project = await db.projects.findOne({
        _id: applyInvite.project_id
      });
      if (!project) {
        throw new ErrorWithStatus({
          message: 'Project không tồn tại',
          code: 'PROJECT_NOT_FOUND',
          status: httpStatus.BAD_REQUEST
        });
      }
      if (!project.admin_id.equals(user_id)) {
        throw new ErrorWithStatus({
          message: 'Bạn không có quyền chấp nhận ứng tuyển này',
          code: 'NOT_PERMISSION',
          status: httpStatus.BAD_REQUEST
        });
      }
    } else {
      if (user_id !== applyInvite.user_id) {
        throw new ErrorWithStatus({
          message: 'Bạn không có quyền chấp nhận lời mời này',
          code: 'NOT_PERMISSION',
          status: httpStatus.BAD_REQUEST
        });
      }
    }

    await db.projects.updateOne(
      {
        _id: applyInvite.project_id
      },
      {
        $push: {
          members: {
            _id: applyInvite.user_id,
            role: RoleMemberProject.Member
          }
        }
      }
    );
    await db.applyInvitations.deleteOne({
      _id: apply_invite_id
    });
  }

  async getMyProjects(page: number, limit: number, payload: GetMyProjectsRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const [projects, total] = await Promise.all([
      db.projects
        .aggregate([
          {
            $match: {
              $and: [{ $or: [{ admin_id: user_id }, { 'members.user_id': user_id }] }, { status: payload.type }]
            }
          },
          {
            $lookup: {
              from: 'Users',
              localField: 'admin_id',
              foreignField: '_id',
              as: 'admin_info'
            }
          },
          {
            $skip: (page - 1) * limit
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      db.projects.countDocuments({
        $and: [{ $or: [{ admin_id: user_id }, { 'members.user_id': user_id }] }, { status: payload.type }]
      })
    ]);
    const response = {
      page: page,
      limit: limit,
      total: total,
      total_page: Math.ceil(total / limit),
      data: projects
    };
    return response;
  }

  async getApplyInvite(payload: GetApplyInviteRequest) {
    const project_id = new ObjectId(payload.project_id);
    const page = payload.page || 1;
    const limit = payload.limit || 10;

    const result = await db.applyInvitations
      .aggregate([
        {
          $match: { project_id }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info'
          }
        },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: (page - 1) * limit }, { $limit: limit }]
          }
        },
        {
          $project: {
            user_info: {
              password: 0,
              forgot_password_token: 0
            }
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
      ])
      .toArray();

    const response = {
      page: result[0]?.page || 1,
      total_page: result[0]?.total_page || 0,
      limit: limit,
      data: result[0]?.data || []
    };

    return response;
  }

  async rejectApplyInvite(payload: AcceptApplyInviteRequest) {
    const apply_invite_id = new ObjectId(payload.apply_invite_id);
    await db.applyInvitations.deleteOne({
      _id: apply_invite_id
    });
  }
}

const projectsService = new ProjectsService();
export default projectsService;
