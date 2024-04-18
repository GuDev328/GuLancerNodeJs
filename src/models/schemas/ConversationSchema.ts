import { ObjectId } from 'mongodb';

interface ConversationType {
  _id?: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content: string;
  created_at?: Date;
}

export default class Conversation {
  _id: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content: string;
  created_at: Date;

  constructor(conversation: ConversationType) {
    this._id = conversation._id || new ObjectId();
    this.sender_id = conversation.sender_id || new ObjectId();
    this.receiver_id = conversation.receiver_id || new ObjectId();
    this.content = conversation.content || '';
    this.created_at = conversation.created_at || new Date();
  }
}
