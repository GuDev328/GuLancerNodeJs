import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import {
  AcceptApplyInviteRequest,
  ApplyInviteRequest,
  BookmarkRequest,
  CreateProjectRequest,
  EditMyProgressRequest,
  EscrowRequest,
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
import MemberProject from '~/models/schemas/MemberProject';

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
      payload.technologies.map(async (tech) => {
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
      salary: Number(payload.salary),
      salaryType: payload.salaryType,
      description: payload.description,
      technologies: techsFinds,
      fields: fieldsFinds,
      end_date: new Date(payload.endDate),
      start_date: new Date(payload.startDate)
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
                techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null
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
              ...(techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null),
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

                techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null
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
              ...(techsId?.length ? { technologies: { $elemMatch: { $in: techsId } } } : null),
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
      payload.fields?.length && payload.technologies?.length
        ? queryHasTechField
        : payload.fields?.length
          ? queryHasField
          : payload.technologies?.length
            ? queryHasTech
            : queryNoTechField;
    const result = await db.projects
      .aggregate([
        {
          $match: {
            status: StatusProject.Recruiting
          }
        },
        ...query
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
    const checkIsMember = await db.memberProject.findOne({
      user_id: new ObjectId(user_id),
      project_id: new ObjectId(project_id)
    });
    if (checkIsMember) {
      throw new ErrorWithStatus({
        message: 'Bạn đã là thành viên của dự án này',
        code: 'ALREADY_MEMBER',
        status: httpStatus.BAD_REQUEST
      });
    }

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
      salary: payload.salary ? payload.salary : project.salary,
      time_to_complete: payload.time_to_complete ? new Date(payload.time_to_complete) : project.end_date
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

    await db.memberProject.insertOne(
      new MemberProject({
        user_id: applyInvite.user_id,
        project_id: applyInvite.project_id,
        salary: applyInvite.salary
      })
    );

    await db.applyInvitations.deleteOne({
      _id: apply_invite_id
    });
  }

  async getMyProjects(page: number, limit: number, payload: GetMyProjectsRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const projectAsMember = await db.memberProject.find({ user_id }).toArray();
    const projectIdAsMember = projectAsMember.map((item) => item.project_id);

    const [projects, total] = await Promise.all([
      db.projects
        .aggregate([
          {
            $match: {
              $and: [
                { $or: [{ admin_id: user_id }, { _id: { $in: projectIdAsMember } }] },
                ...[payload.type !== undefined ? { status: payload.type } : {}]
              ]
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
        $and: [
          { $or: [{ admin_id: user_id }, { _id: { $in: projectIdAsMember } }] },
          ...[payload.type !== undefined ? { status: payload.type } : {}]
        ]
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

  async getMarket() {
    const result = await db.projects
      .aggregate([
        {
          $match: { status: StatusProject.Recruiting }
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
        }
      ])
      .toArray();
    const projectNewToday = await db.projects.find({ created_at: new Date() }).toArray();
    const projectResult = {
      total: result.length,
      today: projectNewToday.length
    };

    interface Item {
      _id: ObjectId;
      name: string;
      total: number;
    }

    let techResult: Item[] = [];
    let fieldResult: Item[] = [];

    result.map((project) => {
      project.technologies_info.map((tech: Technology) => {
        const find = techResult.findIndex((item) => item._id.equals(tech._id));
        if (find !== -1) {
          techResult[find].total++;
        } else {
          techResult.push({
            _id: tech._id,
            name: tech.name,
            total: 1
          });
        }
      });
      project.fields_info.map((field: Field) => {
        const find = fieldResult.findIndex((item) => item._id.equals(field._id));
        if (find !== -1) {
          fieldResult[find].total++;
        } else {
          fieldResult.push({
            _id: field._id,
            name: field.name,
            total: 1
          });
        }
      });
    });

    techResult.sort((a, b) => b.total - a.total);
    fieldResult.sort((a, b) => b.total - a.total);
    const techResultOther = techResult.slice(5, techResult.length).reduce((acc, item) => acc + item.total, 0);
    const fieldResultOther = fieldResult.slice(5, fieldResult.length).reduce((acc, item) => acc + item.total, 0);
    techResult = techResult.slice(0, 5);
    fieldResult = fieldResult.slice(0, 5);
    techResult.push({
      _id: new ObjectId(),
      name: 'Khác',
      total: techResultOther
    });
    fieldResult.push({
      _id: new ObjectId(),
      name: 'Khác',
      total: fieldResultOther
    });

    return {
      projectResult,
      techResult,
      fieldResult
    };
  }

  async editMyProgress(payload: EditMyProgressRequest) {
    const formatMilestoneInfo = payload.milestone_info.map((item) => ({
      ...item,
      day_to_done: new Date(item.day_to_done),
      day_to_payment: undefined,
      status: 'NOT_READY' as 'NOT_READY' | 'PROCESSING' | 'PAYING' | 'COMPLETE' | 'DISPUTED'
    }));
    const result = await db.memberProject.findOneAndUpdate(
      {
        user_id: new ObjectId(payload.decodeAuthorization.payload.userId),
        project_id: new ObjectId(payload.project_id)
      },
      {
        $set: {
          salary: payload.salary,
          number_of_milestone: payload.number_of_milestone,
          milestone_info: formatMilestoneInfo,
          date_to_complete: new Date(payload.date_to_complete)
        }
      }
    );
    return result;
  }

  async getOverViewProgress(project_id: ObjectId) {
    const membersProject = await db.memberProject
      .aggregate<MemberProject>([
        {
          $match: {
            project_id
          }
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
          $lookup: {
            from: 'Projects',
            localField: 'project_id',
            foreignField: '_id',
            as: 'project_info'
          }
        },
        {
          $project: {
            'user_info.password': 0,
            'user_info.forgot_password_token': 0,
            'user_info.verified_info.img_font': 0,
            'user_info.verified_info.img_back': 0,
            'user_info.verified_info.vid_portrait': 0
          }
        }
      ])
      .toArray();

    let totalEscrowing = 0;
    let totalAmountToBePaid = 0;
    let amountPaid = 0;
    const progressMember: any = [];
    membersProject.forEach((item, index) => {
      totalEscrowing += item.escrowed;
      totalAmountToBePaid += item.salary;
      const totalPaid = item.milestone_info.reduce((sum, itemC) => {
        if (itemC.status === 'COMPLETE') return sum + itemC.salary;
        else return sum;
      }, 0);
      amountPaid += totalPaid;
      const phaseCompleteReverse = item.milestone_info
        .slice()
        .reverse()
        .findIndex((itemC) => itemC.status === 'COMPLETE');
      const lastPhaseComplete =
        phaseCompleteReverse !== -1 ? item.milestone_info.length - 1 - phaseCompleteReverse : -1;

      progressMember.push({
        ...item,
        totalPaid,
        currentPhase: item.milestone_info[lastPhaseComplete + 1]
      });
    });
    return {
      totalEscrowing,
      totalAmountToBePaid,
      amountPaid,
      progressMember
    };
  }

  async escrow(payload: EscrowRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const user = await db.users.findOne({ _id: user_id });
    if (!user)
      throw new ErrorWithStatus({
        message: 'Không tìm thấy dữ liệu của người dùng này.',
        status: httpStatus.NOT_FOUND
      });

    const project_ids = (await db.projects.find({ admin_id: user_id }).toArray()).map((item) => item._id);
    const member_project = await db.memberProject.find({ project_id: { $in: project_ids } }).toArray();
    const escrowing = member_project.reduce((sum, item) => sum + item.escrowed, 0);

    if (user.amount - escrowing < payload.amount)
      throw new ErrorWithStatus({
        status: httpStatus.BAD_REQUEST,
        message: 'Số dư khả dụng không đủ để ký quỹ!'
      });

    const res = await db.memberProject.findOneAndUpdate(
      { _id: new ObjectId(payload.member_project_id) },
      {
        $inc: { escrowed: Number(payload.amount) }
      }
    );
    return res;
  }
}

const projectsService = new ProjectsService();
export default projectsService;
