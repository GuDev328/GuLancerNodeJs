import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { CreateTaskRequest, GetAllTaskRequest } from '~/models/requests/TaskRequest';
import Task from '~/models/schemas/TaskSchema';
import { TaskStatus } from '~/constants/enum';

class TaskService {
  constructor() {}

  async createTask(payload: CreateTaskRequest) {
    const findProject = await db.projects.findOne({ _id: new ObjectId(payload.project_id) });
    if (!findProject) {
      throw new Error('Không tìm thấy dự án');
    }
    const task = new Task({
      project_id: new ObjectId(payload.project_id),
      title: payload.title,
      description: payload.description,
      status: TaskStatus.TODO,
      assign_to: new ObjectId(payload.assign_to),
      deadline: payload.deadline,
      created_by: new ObjectId(payload.decodeAuthorization.payload.userId)
    });
    await db.tasks.insertOne(task);
  }

  async getAllTask(payload: GetAllTaskRequest, page: number, limit: number) {
    const query: any = { project_id: new ObjectId(payload.project_id) };
    if (payload.title) {
      query.title = payload.title;
    }

    if (payload.status && payload.status.length > 0) {
      query.status = { $in: payload.status };
    }
    if (payload.assign_to && payload.assign_to.length > 0) {
      query.assign_to = { $in: payload.assign_to.map((id) => new ObjectId(id)) };
    }
    if (payload.deadline_from) {
      query.deadline = {};
      query.deadline.$gte = payload.deadline_from;
    }
    if (payload.deadline_to) {
      query.deadline.$lte = payload.deadline_to;
    }
    const result = await db.tasks
      .aggregate([
        {
          $match: query
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'assign_to',
            foreignField: '_id',
            as: 'assign_to_info'
          }
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray();
    const total = await db.tasks.countDocuments(query);
    return {
      page,
      limit,
      result,
      total_page: Math.ceil(total / limit)
    };
  }
}

const taskService = new TaskService();
export default taskService;
