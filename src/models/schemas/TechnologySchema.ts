import { ObjectId } from 'mongodb';

interface TechnologyType {
  _id?: ObjectId;
  name: string;
  created_at?: Date;
}

export default class Technology {
  _id: ObjectId;
  name: string;
  created_at: Date;

  constructor(technology: TechnologyType) {
    this._id = technology._id || new ObjectId();
    this.name = technology.name || '';
    this.created_at = technology.created_at || new Date();
  }
}
