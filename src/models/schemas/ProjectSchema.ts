import { ObjectId } from 'mongodb';
import { GroupTypes, SalaryType, StatusProject } from '~/constants/enum';
import Technology from './TechnologySchema';
import Field from './FieldSchema';

interface ProjectType {
  _id?: ObjectId;
  title: string;
  status?: StatusProject;
  admins_id: ObjectId[];
  max_member?: number;
  members_id?: ObjectId[];
  salary: number;
  salaryType: SalaryType;
  description: string;
  technologys: Technology[];
  fields: Field[];
}

export default class Project {
  _id: ObjectId;
  title: string;
  status: StatusProject;
  admins_id: ObjectId[];
  max_member: number;
  members_id: ObjectId[];
  salary: number;
  salaryType: SalaryType;
  description: string;
  technologys: Technology[];
  fields: Field[];

  constructor(project: ProjectType) {
    this._id = project._id || new ObjectId();
    this.title = project.title || '';
    this.status = project.status || StatusProject.NotReady;
    this.admins_id = project.admins_id || [];
    this.max_member = project.max_member || 0;
    this.members_id = project.members_id || [];
    this.salary = project.salary || 0;
    this.salaryType = project.salaryType || SalaryType.Project;
    this.description = project.description || '';
    this.technologys = project.technologys || [];
    this.fields = project.fields || [];
  }
}
