import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { CreateTaskRequest, GetAllTaskRequest } from '~/models/requests/TaskRequest';
import taskService from '~/services/taskServices';

export const createTaskController = async (req: Request<ParamsDictionary, any, CreateTaskRequest>, res: Response) => {
  await taskService.createTask(req.body);
  res.status(200).json({
    message: 'Create tasksuscess'
  });
};

export const getAllTaskController = async (req: Request<ParamsDictionary, any, GetAllTaskRequest>, res: Response) => {
  const { result, page, limit, total_page } = await taskService.getAllTask(
    req.body,
    Number(req.query.page),
    Number(req.query.limit)
  );
  res.status(200).json({
    message: 'Lấy danh sách công việc thành công',
    result,
    page,
    limit,
    total_page
  });
};
