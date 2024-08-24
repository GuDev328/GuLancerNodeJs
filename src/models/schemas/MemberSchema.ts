import { ObjectId } from 'mongodb';
import { MemberStatus } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface MemberType {
  _id?: ObjectId;
  user_id: ObjectId;
  group_id: ObjectId;
  status: MemberStatus;
  created_at?: Date;
}

export default class Member {
  _id: ObjectId;
  user_id: ObjectId;
  group_id: ObjectId;
  status: MemberStatus;
  created_at: Date;

  constructor(member: MemberType) {
    this._id = member._id || new ObjectId();
    this.user_id = member.user_id || new ObjectId();
    this.group_id = member.group_id || new ObjectId();
    this.status = member.status || MemberStatus.Waiting;
    this.created_at = member.created_at || DateVi();
  }
}
