import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import {
  ChangeStatusTaskRequest,
  CreateTaskRequest,
  GetAllTaskRequest,
  UpdateTaskRequest
} from '~/models/requests/TaskRequest';
import taskService from '~/services/taskServices';

export const createDisputeController = async (
  req: Request<ParamsDictionary, any, CreateTaskRequest>,
  res: Response
) => {
  await taskService.createTask(req.body);
  res.status(200).json({
    message: 'Create tasksuscess'
  });
};
