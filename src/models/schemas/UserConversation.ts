import { ObjectId } from 'mongodb';

import { DateVi } from '~/utils/date-vi';

interface ILastMessage {
  user_id: ObjectId | null;
  message: string | null;
  time: Date | null;
}
interface IDeleteConversationAt {
  user_id_1: Date | null;
  user_id_2: Date | null;
}

interface UserConversationType {
  _id?: ObjectId;
  user_id_1: ObjectId;
  user_id_2: ObjectId;
  last_message?: ILastMessage;
  deleted_at?: IDeleteConversationAt;
  created_at?: Date;
}

export default class UserConversation {
  _id: ObjectId;
  user_id_1: ObjectId;
  user_id_2: ObjectId;
  last_message: ILastMessage;
  deleted_at: IDeleteConversationAt;
  created_at: Date;

  constructor(userConversation: UserConversationType) {
    this._id = userConversation._id || new ObjectId();
    this.user_id_1 = userConversation.user_id_1;
    this.user_id_2 = userConversation.user_id_2;
    this.last_message = {
      user_id: null,
      message: null,
      time: null
    };
    this.deleted_at = {
      user_id_1: null,
      user_id_2: null
    };
    this.created_at = userConversation.created_at || DateVi();
  }
}
