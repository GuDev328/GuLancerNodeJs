import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import fieldService from '~/services/fieldServices';

import technologyService from '~/services/technologyServices';

export const getAllFieldController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await fieldService.getAllField();
  res.status(200).json({
    result,
    message: 'Create suscess'
  });
};
