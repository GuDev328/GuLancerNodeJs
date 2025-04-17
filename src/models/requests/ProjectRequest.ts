import { JwtPayload } from 'jsonwebtoken';
import {
  InvitationType,
  Media,
  ProjectOrderBy,
  SalaryType,
  StatusProject,
  TweetTypeEnum,
  TypeProject
} from '~/constants/enum';

export interface BookmarkRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
}

export interface EditMyProgressRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
  salary: number;
  date_to_complete: string;
  number_of_milestone: number;
  milestone_info: {
    no: number;
    day_to_done: string;
    salary: number;
  }[];
}

export interface EscrowRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
  member_project_id: string;
  amount: number;
}

export interface CreateProjectRequest {
  decodeAuthorization: JwtPayload;
  title: string;
  fields: string[];
  technologies: string[];
  salaryType: SalaryType;
  description: string;
  endDate: Date;
  startDate: Date;
}

export interface GetAllProjectRequest {
  key?: string;
  fields?: string[];
  technologies?: string[];
  salaryType?: SalaryType;
  salaryFrom?: number;
  salaryTo?: number;
  orderBy?: ProjectOrderBy;
}

export interface CreateTechRequest {
  decodeAuthorization: JwtPayload;
  name: string;
}

export interface ApplyInviteRequest {
  decodeAuthorization: JwtPayload;
  user_id: string;
  project_id: string;
  type: InvitationType;
  content: string;
  salary: number;
  time_to_complete: number; //số ngày dự kiến hoàn thành dự án
}

export interface EditApplyInviteRequest {
  decodeAuthorization: JwtPayload;
  apply_invite_id: string;
  content: string;
  salary: number;
  time_to_complete: number; //số ngày dự kiến hoàn thành dự án
}

export interface GetApplyInviteRequest {
  project_id: string;
  page?: number;
  limit?: number;
}

export interface AcceptApplyInviteRequest {
  decodeAuthorization: JwtPayload;
  apply_invite_id: string;
}

export interface GetMyProjectsRequest {
  decodeAuthorization: JwtPayload;
  type: StatusProject;
}
