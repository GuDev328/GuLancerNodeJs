import { ObjectId } from 'mongodb';
import { GroupTypes } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface GroupType {
  _id?: ObjectId;
  admin_id: ObjectId[];
  name: string;
  type: GroupTypes;
  censor: boolean;
  created_at?: Date;
  updated_at?: Date;
  description?: string;
  cover_photo?: string;
}

export default class Group {
  _id: ObjectId;
  admin_id: ObjectId[];
  name: string;
  type: GroupTypes;
  created_at: Date;
  updated_at: Date;
  censor: boolean;
  description: string;
  cover_photo: string;

  constructor(group: GroupType) {
    this._id = group._id || new ObjectId();
    this.admin_id = group.admin_id || [];
    this.name = group.name || '';
    this.type = group.type || GroupTypes.Public;
    this.censor = group.censor || true;
    this.created_at = group.created_at || DateVi();
    this.updated_at = group.updated_at || DateVi();
    this.description = group.description || '';
    this.cover_photo = group.cover_photo || '';
  }
}
