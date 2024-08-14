import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { CreateGroupRequest, DecodeAuthorization } from '~/models/requests/GroupRequest';
import groupsService from '~/services/groupsServices';

export const createGroupController = async (req: Request<ParamsDictionary, any, CreateGroupRequest>, res: Response) => {
  await groupsService.createGroup(req.body);
  res.status(200).json({
    message: 'Create group suscess'
  });
};

export const getMyGroupsController = async (
  req: Request<ParamsDictionary, any, DecodeAuthorization>,
  res: Response
) => {
  const result = await groupsService.getMyGroups(req.body);
  res.status(200).json({
    result,
    message: 'Lấy danh sách nhóm thành công'
  });
};
