import { JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { TaskStatus } from '~/constants/enum';

export interface CreateTaskRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
  title: string;
  description: string;
  assign_to: string;
  deadline: Date;
}

export interface UpdateTaskRequest {
  _id: string;
  title: string;
  description: string;
  assign_to: string;
  deadline: Date;
}

export interface GetAllTaskRequest {
  project_id: string;
  title?: string;
  status?: TaskStatus[];
  assign_to?: string[];
  deadline_from?: Date;
  deadline_to?: Date;
}
