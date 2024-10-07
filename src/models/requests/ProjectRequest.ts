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

export interface CreateProjectRequest {
  decodeAuthorization: JwtPayload;
  title: string;
  fields: string[];
  technologies: string[];
  salaryType: SalaryType;
  salary: number;
  description: string;
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
  project_id: string;
  type: InvitationType;
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
