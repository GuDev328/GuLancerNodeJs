import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
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
  const result = await db.applyInvitations
    .find({
      project_id: new ObjectId(req.body.project_id)
    })
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
    message: 'Lấy danh sách thành công'
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
