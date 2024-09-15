import { JwtPayload } from 'jsonwebtoken';
import { Media, ProjectOrderBy, SalaryType, TweetTypeEnum, TypeProject } from '~/constants/enum';

export interface BookmarkRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
}

export interface CreateProjectRequest {
  decodeAuthorization: JwtPayload;
  title: string;
  fields: string[];
  technologys: string[];
  salaryType: SalaryType;
  salary: number;
  description: string;
}

export interface GetAllProjectRequest {
  key?: string;
  fields?: string[];
  technologys?: string[];
  salaryType?: SalaryType;
  salaryFrom?: number;
  salaryTo?: number;
  orderBy?: ProjectOrderBy;
}

export interface CreateTechRequest {
  decodeAuthorization: JwtPayload;
  name: string;
}
