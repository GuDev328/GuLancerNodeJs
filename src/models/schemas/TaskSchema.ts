import { ObjectId } from 'mongodb';
import { TaskStatus } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface TaskType {
  _id?: ObjectId;
  project_id: ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  assign_to: ObjectId;
  deadline: Date;
  created_by: ObjectId;
  created_at?: Date;
}

export default class Task {
  _id: ObjectId;
  project_id: ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  assign_to: ObjectId;
  deadline: Date;
  created_by: ObjectId;
  created_at: Date;

  constructor(task: TaskType) {
    this._id = task._id || new ObjectId();
    this.title = task.title || '';
    this.description = task.description || '';
    this.project_id = task.project_id || new ObjectId();
    this.status = task.status || TaskStatus.TODO;
    this.assign_to = task.assign_to;
    this.deadline = task.deadline;
    this.created_by = task.created_by;
    this.created_at = task.created_at || DateVi();
  }
}
