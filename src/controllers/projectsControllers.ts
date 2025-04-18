import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { HistoryAmountTypeEnum, InvitationType, StatusProject } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import {
  AcceptApplyInviteRequest,
  ApplyInviteRequest,
  BookmarkRequest,
  CreateProjectRequest,
  EditApplyInviteRequest,
  EditMyProgressRequest,
  EscrowRequest,
  GetAllProjectRequest,
  GetApplyInviteRequest,
  GetMyProjectsRequest
} from '~/models/requests/ProjectRequest';
import HistoryAmount from '~/models/schemas/HistoryAmountSchema';
import db from '~/services/databaseServices';
import projectsService from '~/services/projectsServices';
import bookmarksService from '~/services/projectsServices';
import { DateVi } from '~/utils/date-vi';

export const createProjectController = async (
  req: Request<ParamsDictionary, any, CreateProjectRequest>,
  res: Response
) => {
  await projectsService.createProject(req.body);
  res.status(200).json({
    message: 'Create suscess'
  });
};

export const getAllProjectsController = async (
  req: Request<ParamsDictionary, any, GetAllProjectRequest>,
  res: Response
) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const result = await projectsService.getAll(page, limit, req.body);
  res.status(200).json({
    result,
    message: 'Get Projects suscess'
  });
};

export const getListProjectRecruitingController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await db.projects
    .find({ admin_id: new ObjectId(req.body.decodeAuthorization.payload.userId), status: StatusProject.Recruiting })
    .toArray();
  res.status(200).json({
    result,
    message: 'Get Projects Recruiting suscess'
  });
};

export const applyInviteController = async (req: Request<ParamsDictionary, any, ApplyInviteRequest>, res: Response) => {
  await projectsService.applyInvite(req.body);
  res.status(200).json({
    message: 'Gửi lời mời hoặc ứng tuyển thành công'
  });
};

export const editApplyInviteController = async (
  req: Request<ParamsDictionary, any, EditApplyInviteRequest>,
  res: Response
) => {
  await projectsService.editApplyInvite(req.body);
  res.status(200).json({
    message: 'Edit Apply Invite suscess'
  });
};

export const getApplyInviteController = async (
  req: Request<ParamsDictionary, any, GetApplyInviteRequest>,
  res: Response
) => {
  const result = await projectsService.getApplyInvite(req.body);
  res.status(200).json({
    result,
    message: 'Lấy danh sách thành công'
  });
};

export const detailApplyInviteController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const apply_invite_id = new ObjectId(req.params.id);
  const result = await projectsService.detailApplyInvite(apply_invite_id);
  res.status(200).json({
    result,
    message: 'Lấy thông tin thành công'
  });
};

export const getDetailProjectController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const projectId = req.params.id;
  const result = await db.projects
    .aggregate([
      {
        $match: {
          _id: new ObjectId(projectId)
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
        $lookup: {
          from: 'Technologies',
          localField: 'technologies',
          foreignField: '_id',
          as: 'tech_info'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'fields',
          foreignField: '_id',
          as: 'field_info'
        }
      }
    ])
    .toArray();
  res.status(200).json({
    result,
    message: 'Lấy danh sách thành công'
  });
};

export const acceptApplyInviteController = async (
  req: Request<ParamsDictionary, any, AcceptApplyInviteRequest>,
  res: Response
) => {
  const result = await projectsService.acceptApplyInvite(req.body);
  res.status(200).json({
    result,
    message: 'Chấp nhận ứng tuyển thành công'
  });
};

export const getMemberController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const projectId = req.params.id;
  const result = await db.memberProject
    .aggregate([
      {
        $match: {
          project_id: new ObjectId(projectId)
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

  res.status(200).json({
    result: result.map((item) => item.user_info[0]),
    message: 'Lấy danh sách thành công'
  });
};

export const rejectApplyInviteController = async (
  req: Request<ParamsDictionary, any, AcceptApplyInviteRequest>,
  res: Response
) => {
  const result = await projectsService.rejectApplyInvite(req.body);
  res.status(200).json({
    result,
    message: 'Hủy ứng tuyển thành công'
  });
};

export const bookmarkController = async (req: Request<ParamsDictionary, any, BookmarkRequest>, res: Response) => {
  await bookmarksService.bookmark(req.body);
  res.status(200).json({
    message: 'Bookmark suscess'
  });
};

export const unbookmarkController = async (req: Request<ParamsDictionary, any, BookmarkRequest>, res: Response) => {
  await bookmarksService.unbookmark(req.body);
  res.status(200).json({
    message: 'Unbookmark suscess'
  });
};

export const getMyProjectsController = async (
  req: Request<ParamsDictionary, any, GetMyProjectsRequest>,
  res: Response
) => {
  const limit = Number(req.query.limit as string);
  const page = Number(req.query.page as string);
  const result = await projectsService.getMyProjects(page, limit, req.body);
  res.status(200).json({
    result,
    message: 'Get My Projects suscess'
  });
};

export const getMarketController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await projectsService.getMarket();
  res.status(200).json({
    result,
    message: 'Get Market suscess'
  });
};

export const getMyProgressController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { project_id } = req.params;
  const membersProject = await db.memberProject
    .aggregate([
      {
        $match: {
          project_id: new ObjectId(project_id),
          user_id: new ObjectId(req.body.decodeAuthorization.payload.userId)
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
  const phaseCompleteReverse = membersProject[0].milestone_info
    .slice()
    .reverse()
    .findIndex((itemC: any) => itemC.status === 'COMPLETE');
  const lastPhaseComplete =
    phaseCompleteReverse !== -1 ? membersProject[0].milestone_info.length - 1 - phaseCompleteReverse : -1;
  res.status(200).json({
    result: {
      ...membersProject[0],
      indexCurrentPhase: lastPhaseComplete + 1
    },
    message: 'Get Market suscess'
  });
};

export const EditMyProgressController = async (
  req: Request<ParamsDictionary, any, EditMyProgressRequest>,
  res: Response
) => {
  const project = await db.projects.findOne({ _id: new ObjectId(req.body.project_id) });
  if (!project)
    throw new ErrorWithStatus({
      message: 'Không tìm thấy dự án',
      status: httpStatus.NOT_FOUND
    });
  if (project.status !== StatusProject.Recruiting) {
    throw new ErrorWithStatus({
      message: 'Chỉ có thể thay đổi khi dự án ở giai đoạn tuyển dụng nhân sự',
      status: httpStatus.BAD_REQUEST
    });
  }
  const memberProject = await db.memberProject.findOne({
    project_id: new ObjectId(req.body.project_id),
    user_id: new ObjectId(req.body.decodeAuthorization.payload.userId)
  });
  if (!memberProject)
    throw new ErrorWithStatus({
      message: 'Bạn không phải thành viên của dự án',
      status: httpStatus.FORBIDDEN
    });
  const result = await projectsService.editMyProgress(req.body);
  res.status(200).json({
    result,
    message: 'Edit Progress suscess'
  });
};

export const getOverviewProgress = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { project_id } = req.params;
  const result = await projectsService.getOverViewProgress(new ObjectId(project_id));
  res.status(200).json({
    result,
    message: 'Get suscess'
  });
};

export const escrowController = async (req: Request<ParamsDictionary, any, EscrowRequest>, res: Response) => {
  const result = await projectsService.escrow(req.body);
  res.status(200).json({
    result,
    message: 'Ký quỹ thành công'
  });
};

export const toRecruitingController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { project_id, number_people, deadline, salary } = req.body;
  const result = await db.projects.findOneAndUpdate(
    { _id: new ObjectId(project_id) },
    {
      $set: {
        status: StatusProject.Recruiting,
        recruitmentInfo: {
          number_people: Number(number_people),
          deadline: new Date(deadline),
          salary: Number(salary)
        }
      }
    }
  );

  res.status(200).json({
    result,
    message: 'Thành công'
  });
};

export const toProcessingController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const membersProject = await db.memberProject.find({ project_id: new ObjectId(req.body.project_id) }).toArray();

  const isAllMemberNotReady = membersProject.every((item, index) => {
    const { currentPhase } = projectsService.getCurrentPhase(item);
    return currentPhase.status === 'NOT_READY';
  });

  const result = await db.projects.findOneAndUpdate(
    { _id: new ObjectId(req.body.project_id) },
    { $set: { status: isAllMemberNotReady ? StatusProject.PendingMemberReady : StatusProject.Processing } }
  );

  await db.applyInvitations.deleteMany({ project_id: new ObjectId(req.body.project_id) });

  res.status(200).json({
    result,
    message: 'Thành công'
  });
};

export const memberStartPhaseController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const project_id = new ObjectId(req.body.project_id);

  const project = await db.projects.findOne({ _id: project_id });

  if (!project) throw new ErrorWithStatus({ message: 'Dự án không tồn tại', status: httpStatus.NOT_FOUND });

  if (project?.status === StatusProject.NotReady || project?.status === StatusProject.Recruiting)
    throw new ErrorWithStatus({ message: 'Dự án chưa bắt đầu', status: httpStatus.BAD_REQUEST });

  const membersProject = await db.memberProject.findOne({ project_id, user_id });

  if (!membersProject)
    throw new ErrorWithStatus({ message: 'Không tìm thấy thành viên dự án', status: httpStatus.NOT_FOUND });

  const { currentPhase, indexCurrentPhase } = projectsService.getCurrentPhase(membersProject);

  const newMileStoneInfo = membersProject.milestone_info;
  newMileStoneInfo[indexCurrentPhase] = {
    ...currentPhase,
    status: 'PROCESSING'
  };
  if (currentPhase.salary_unpaid > membersProject.escrowed)
    throw new ErrorWithStatus({
      message: 'Chủ dự án chưa ký quỹ cho giai đoạn này. Hãy liên hệ với chủ dự án',
      status: httpStatus.BAD_REQUEST
    });

  await db.memberProject.findOneAndUpdate(
    { project_id, user_id },
    {
      $set: { milestone_info: newMileStoneInfo }
    }
  );

  if (project.status === StatusProject.PendingMemberReady) {
    await db.projects.findOneAndUpdate(
      { _id: project_id },
      {
        $set: {
          status: StatusProject.Processing
        }
      }
    );
  }

  res.status(200).json({
    message: 'Thành công'
  });
};

export const memberDonePhaseController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const project_id = new ObjectId(req.body.project_id);

  const project = await db.projects.findOne({ _id: project_id });

  if (!project) throw new ErrorWithStatus({ message: 'Dự án không tồn tại', status: httpStatus.NOT_FOUND });

  const memberProject = await db.memberProject.findOne({ project_id, user_id });

  if (!memberProject)
    throw new ErrorWithStatus({ message: 'Không tìm thấy thành viên dự án', status: httpStatus.NOT_FOUND });
  const { currentPhase, indexCurrentPhase } = projectsService.getCurrentPhase(memberProject);
  const newMileStoneInfo = memberProject.milestone_info;
  newMileStoneInfo[indexCurrentPhase] = {
    ...currentPhase,
    day_to_done: DateVi(),
    status: 'PAYING'
  };

  await db.memberProject.findOneAndUpdate(
    { project_id, user_id },
    {
      $set: { milestone_info: newMileStoneInfo }
    }
  );

  const membersProject = await db.memberProject.find({ project_id }).toArray();
  const isAllMemberPaying = membersProject.every((item) => {
    const { currentPhase } = projectsService.getCurrentPhase(item);
    return currentPhase.status === 'PAYING';
  });
  if (isAllMemberPaying) {
    await db.projects.findOneAndUpdate({ _id: project_id }, { $set: { status: StatusProject.Paying } });
  }
  res.status(200).json({
    message: 'Thành công'
  });
};

export const payForMemberController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const admin_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const user_id = new ObjectId(req.body.user_id);
  const project_id = new ObjectId(req.body.project_id);

  const result = await projectsService.payForMember(project_id, user_id, admin_id);
  res.status(200).json({
    result,
    message: 'Thành công'
  });
};

export const getListApplyController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  // Get total count
  const total = await db.applyInvitations.countDocuments({
    user_id: userId,
    type: InvitationType.Apply
  });

  // Get paginated results with related data
  const result = await db.applyInvitations
    .aggregate([
      { $match: { user_id: userId, type: InvitationType.Apply } },
      {
        $lookup: {
          from: 'Projects',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: '$project' },
      {
        $lookup: {
          from: 'Technologies',
          localField: 'project.technologies',
          foreignField: '_id',
          as: 'technologies'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'project.fields',
          foreignField: '_id',
          as: 'fields'
        }
      },
      { $skip: skip },
      { $limit: limit }
    ])
    .toArray();

  res.status(200).json({
    message: 'Get list apply apply success',
    result: {
      applies: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
};

export const getListInviteController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const userId = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count
  const total = await db.applyInvitations.countDocuments({
    user_id: userId,
    type: InvitationType.Invitation
  });

  // Get paginated results with related data
  const result = await db.applyInvitations
    .aggregate([
      { $match: { user_id: userId, type: InvitationType.Invitation } },
      {
        $lookup: {
          from: 'Projects',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $unwind: '$project' },
      {
        $lookup: {
          from: 'Technologies',
          localField: 'project.technologies',
          foreignField: '_id',
          as: 'technologies'
        }
      },
      {
        $lookup: {
          from: 'Fields',
          localField: 'project.fields',
          foreignField: '_id',
          as: 'fields'
        }
      },
      { $skip: skip },
      { $limit: limit }
    ])
    .toArray();

  res.status(200).json({
    message: 'Get list apply invite success',
    result: {
      applies: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
};
