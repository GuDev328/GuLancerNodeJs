import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { BookmarkRequest } from '~/models/requests/ProjectRequest';
import bookmarksService from '~/services/projectsServices';

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
