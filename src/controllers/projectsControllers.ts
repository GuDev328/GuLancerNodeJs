import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { StatusProject } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import {
  AcceptApplyInviteRequest,
  ApplyInviteRequest,
  BookmarkRequest,
  CreateProjectRequest,
  EditMyProgressRequest,
  GetAllProjectRequest,
  GetApplyInviteRequest,
  GetMyProjectsRequest
} from '~/models/requests/ProjectRequest';
import db from '~/services/databaseServices';
import projectsService from '~/services/projectsServices';
import bookmarksService from '~/services/projectsServices';

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

export const applyInviteController = async (req: Request<ParamsDictionary, any, ApplyInviteRequest>, res: Response) => {
  await projectsService.applyInvite(req.body);
  res.status(200).json({
    message: 'Gửi lời mời hoặc ứng tuyển thành công'
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
  console.log(project_id, req.body.decodeAuthorization.payload.userId);
  const result = await db.memberProject
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
  console.log(result);
  res.status(200).json({
    result,
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
