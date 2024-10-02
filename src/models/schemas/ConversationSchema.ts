import { ObjectId } from 'mongodb';
import { Media } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface ConversationType {
  _id?: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content: string;
  medias: Media[];
  created_at?: Date;
}

export default class Conversation {
  _id: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content: string;
  medias: Media[];
  created_at: Date;

  constructor(conversation: ConversationType) {
    this._id = conversation._id || new ObjectId();
    this.sender_id = conversation.sender_id || new ObjectId();
    this.receiver_id = conversation.receiver_id || new ObjectId();
    this.content = conversation.content || '';
    this.medias = conversation.medias || [];
    this.created_at = conversation.created_at || DateVi();
  }
}
