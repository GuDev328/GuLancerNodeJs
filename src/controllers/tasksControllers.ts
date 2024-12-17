import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { CreateTaskRequest, GetAllTaskRequest, UpdateTaskRequest } from '~/models/requests/TaskRequest';
import taskService from '~/services/taskServices';

export const createTaskController = async (req: Request<ParamsDictionary, any, CreateTaskRequest>, res: Response) => {
  await taskService.createTask(req.body);
  res.status(200).json({
    message: 'Create tasksuscess'
  });
};

export const updateTaskController = async (req: Request<ParamsDictionary, any, UpdateTaskRequest>, res: Response) => {
  await taskService.updateTask(req.body);
  res.status(200).json({
    message: 'Cập nhật công việc thành công'
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

export const getDetailTaskController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.params;
  const result = await taskService.getDetail(id);
  res.status(200).json({
    result,
    message: 'Lấy thông tin công việc thành công'
  });
};
