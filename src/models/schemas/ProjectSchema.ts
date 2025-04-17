import { ObjectId } from 'mongodb';
import { GroupTypes, RoleMemberProject, SalaryType, StatusProject } from '~/constants/enum';
import Technology from './TechnologySchema';
import Field from './FieldSchema';
import { DateVi } from '~/utils/date-vi';

interface RecruitmentInfo {
  number_people: number;
  salary: number;
  deadline: Date;
}
interface ProjectType {
  _id?: ObjectId;
  title: string;
  status?: StatusProject;
  admin_id: ObjectId;
  salaryType: SalaryType;
  description: string;
  technologies: ObjectId[];
  fields: ObjectId[];
  recruitmentInfo?: RecruitmentInfo;
  start_date?: Date;
  end_date?: Date;
  created_at?: Date;
}

export default class Project {
  _id: ObjectId;
  title: string;
  status: StatusProject;
  admin_id: ObjectId;
  salaryType: SalaryType;
  description: string;
  technologies: ObjectId[];
  fields: ObjectId[];
  recruitmentInfo: RecruitmentInfo;
  start_date: Date;
  end_date: Date;
  created_at: Date;

  constructor(project: ProjectType) {
    this._id = project._id || new ObjectId();
    this.title = project.title || '';
    this.status = project.status || StatusProject.NotReady;
    this.admin_id = project.admin_id;
    this.salaryType = project.salaryType || SalaryType.Project;
    this.description = project.description || '';
    this.technologies = project.technologies;
    this.fields = project.fields || [];
    this.recruitmentInfo = project.recruitmentInfo || {
      number_people: 0,
      salary: 0,
      deadline: DateVi()
    };
    this.start_date = project.start_date || DateVi();
    this.end_date = project.end_date || DateVi();
    this.created_at = project.created_at || DateVi();
  }
}
