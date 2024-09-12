import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

import technologyService from '~/services/technologyServices';

export const getAllTechController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await technologyService.getAllTech();
  res.status(200).json({
    result,
    message: 'Create suscess'
  });
};
