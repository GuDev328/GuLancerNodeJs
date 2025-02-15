import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface MilestoneInfoType {
  no: number;
  salary: number;
  day_to_done: Date | undefined;
  day_to_payment: Date | undefined;
  status: 'NOT_READY' | 'PROCESSING' | 'PAYING' | 'COMPLETE' | 'DISPUTED';
}

interface MemberProjectType {
  _id?: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  salary: number;
  number_of_milestone?: number; //Số lần trả tiền
  milestone_info?: MilestoneInfoType[];
  date_to_complete?: Date;
  created_at?: Date;
}

export default class MemberProject {
  _id: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  salary: number;
  number_of_milestone: number; //Số lần trả tiền
  milestone_info: MilestoneInfoType[];
  date_to_complete: Date;
  created_at?: Date;

  constructor(member: MemberProjectType) {
    this._id = member._id || new ObjectId();
    this.user_id = member.user_id;
    this.project_id = member.project_id;
    this.salary = member.salary || 0;
    this.number_of_milestone = member.number_of_milestone || 1;
    this.milestone_info = member.milestone_info || [
      {
        no: 1,
        salary: member.salary || 0,
        day_to_done: undefined,
        day_to_payment: undefined,
        status: 'NOT_READY'
      }
    ];
    this.date_to_complete = member.date_to_complete || DateVi();
    this.created_at = member.created_at || DateVi();
  }
}
