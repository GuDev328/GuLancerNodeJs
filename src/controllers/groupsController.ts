import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { CreateGroupRequest, DecodeAuthorization, GroupID } from '~/models/requests/GroupRequest';
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

export const getGroupByIdController = async (
  req: Request<ParamsDictionary, any, DecodeAuthorization>,
  res: Response
) => {
  const { id } = req.params;
  const group_id = new ObjectId(id);
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await groupsService.getGroupById(group_id, user_id);
  res.status(200).json({
    result,
    message: 'Lấy thông tin nhóm thành công'
  });
};

export const joinGroupController = async (req: Request<ParamsDictionary, any, GroupID>, res: Response) => {
  const group_id = new ObjectId(req.body.group_id);
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await groupsService.joinGroup(group_id, user_id);
  res.status(200).json({
    result,
    message: 'Join nhóm thành công'
  });
};
