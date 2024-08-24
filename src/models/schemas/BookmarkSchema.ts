import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface BookmarkType {
  _id?: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  created_at?: Date;
}

export default class Bookmark {
  _id: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  created_at: Date;

  constructor(bookmark: BookmarkType) {
    this._id = bookmark._id || new ObjectId();
    this.user_id = bookmark.user_id || new ObjectId();
    this.project_id = bookmark.project_id || new ObjectId();
    this.created_at = bookmark.created_at || DateVi();
  }
}
