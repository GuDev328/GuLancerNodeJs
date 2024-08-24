import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface FollowerType {
  _id?: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at?: Date;
}

export default class Follower {
  _id: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at: Date;

  constructor(follower: FollowerType) {
    this._id = follower._id || new ObjectId();
    this.user_id = follower.user_id || new ObjectId();
    this.followed_user_id = follower.followed_user_id || new ObjectId();
    this.created_at = follower.created_at || DateVi();
  }
}
