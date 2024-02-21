import { ObjectId } from 'mongodb';

interface DiscussionType {
  _id?: ObjectId;
  user_id: ObjectId;
  issue_id: ObjectId;
  content: string;
  created_at?: Date;
}

export default class Discussion {
  _id: ObjectId;
  user_id: ObjectId;
  issue_id: ObjectId;
  content: string;
  created_at: Date;

  constructor(discuss: DiscussionType) {
    this._id = discuss._id || new ObjectId();
    this.user_id = discuss.user_id || new ObjectId();
    this.issue_id = discuss.issue_id || new ObjectId();
    this.content = discuss.content || '';
    this.created_at = discuss.created_at || new Date();
  }
}
