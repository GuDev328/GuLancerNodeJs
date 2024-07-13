import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';

class ConversationsService {
  constructor() {}

  async getConversation(senderId: string, receiverUserId: string, limit: number, page: number) {
    const result = await db.conversations
      .find({
        $or: [
          {
            receiver_id: new ObjectId(receiverUserId),
            sender_id: new ObjectId(senderId)
          },
          {
            receiver_id: new ObjectId(senderId),
            sender_id: new ObjectId(receiverUserId)
          }
        ]
      })
      .sort({ created_at: -1 })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray();
    const total = await db.conversations.countDocuments({
      $or: [
        {
          receiver_id: new ObjectId(receiverUserId),
          sender_id: new ObjectId(senderId)
        },
        {
          receiver_id: new ObjectId(senderId),
          sender_id: new ObjectId(receiverUserId)
        }
      ]
    });
    return {
      result,
      page,
      total_page: Math.ceil(total / limit)
    };
  }
}

const conversationsService = new ConversationsService();
export default conversationsService;
