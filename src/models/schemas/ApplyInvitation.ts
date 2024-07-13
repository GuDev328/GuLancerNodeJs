import { ObjectId } from 'mongodb';
import { InvitationType } from '~/constants/enum';

interface ApplyInvitationType {
  _id?: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  type: InvitationType;
  content: string;
  salary: number;
  time_to_complete: number; //số ngày dự kiến hoàn thành dự án
  created_at?: Date;
}

export default class ApplyInvitation {
  _id: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  type: InvitationType;
  content: string;
  salary: number;
  time_to_complete: number; //số ngày dự kiến hoàn thành dự án
  created_at: Date;

  constructor(apply: ApplyInvitationType) {
    this._id = apply._id || new ObjectId();
    this.user_id = apply.user_id || new ObjectId();
    this.project_id = apply.project_id || new ObjectId();
    this.type = apply.type || InvitationType.Apply;
    this.content = apply.content || '';
    this.salary = apply.salary || 0;
    this.time_to_complete = apply.time_to_complete || 0;
    this.created_at = apply.created_at || new Date();
  }
}
