import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface FieldType {
  _id?: ObjectId;
  name: string;
  created_at?: Date;
}

export default class Field {
  _id: ObjectId;
  name: string;
  created_at: Date;

  constructor(field: FieldType) {
    this._id = field._id || new ObjectId();
    this.name = field.name || '';
    this.created_at = field.created_at || DateVi();
  }
}
