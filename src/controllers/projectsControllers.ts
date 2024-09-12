import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { BookmarkRequest, CreateProjectRequest } from '~/models/requests/ProjectRequest';
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
