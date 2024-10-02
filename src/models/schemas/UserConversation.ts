import { ObjectId } from 'mongodb';

import { DateVi } from '~/utils/date-vi';

interface UserConversationType {
  _id?: ObjectId;
  user_id: ObjectId;
  chat_with: ObjectId;
  created_at?: Date;
}

export default class UserConversation {
  _id?: ObjectId;
  user_id: ObjectId;
  chat_with: ObjectId;
  created_at?: Date;

  constructor(userConversation: UserConversationType) {
    this._id = userConversation._id || new ObjectId();
    this.user_id = userConversation.user_id;
    this.chat_with = userConversation.chat_with;
    this.created_at = userConversation.created_at || DateVi();
  }
}
