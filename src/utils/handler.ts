import { Request, Response, NextFunction, RequestHandler } from 'express';

export const catchError = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
};
