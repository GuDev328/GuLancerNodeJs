import { ObjectId } from 'mongodb';
import { GroupTypes, RoleMemberProject, SalaryType, StatusProject } from '~/constants/enum';
import Technology from './TechnologySchema';
import Field from './FieldSchema';
import { DateVi } from '~/utils/date-vi';

interface Member {
  _id: ObjectId;
  role: RoleMemberProject;
}

interface ProjectType {
  _id?: ObjectId;
  title: string;
  status?: StatusProject;
  admin_id: ObjectId;
  max_member?: number;
  members?: Member[];
  salary: number;
  salaryType: SalaryType;
  description: string;
  technologys: ObjectId[];
  fields: ObjectId[];
  created_at?: Date;
}

export default class Project {
  _id: ObjectId;
  title: string;
  status: StatusProject;
  admin_id: ObjectId;
  max_member: number;
  members: Member[];
  salary: number;
  salaryType: SalaryType;
  description: string;
  technologys: ObjectId[];
  fields: ObjectId[];
  created_at: Date;

  constructor(project: ProjectType) {
    this._id = project._id || new ObjectId();
    this.title = project.title || '';
    this.status = project.status || StatusProject.NotReady;
    this.admin_id = project.admin_id;
    this.max_member = project.max_member || 0;
    this.members = project.members || [];
    this.salary = project.salary || 0;
    this.salaryType = project.salaryType || SalaryType.Project;
    this.description = project.description || '';
    this.technologys = project.technologys;
    this.fields = project.fields;
    this.created_at = project.created_at || DateVi();
  }
}
