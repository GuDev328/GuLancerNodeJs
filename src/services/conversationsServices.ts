import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';
import { ErrorWithStatus } from '~/models/Errors';

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

  async getChatUsers(userId: string, limit: number, page: number) {
    const result = await db.userConversations
      .aggregate([
        {
          $match: {
            user_id: new ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'chat_with',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $skip: (page - 1) * limit
        },
        {
          $limit: limit
        }
      ])
      .toArray();
    const total = await db.userConversations.countDocuments({
      user_id: new ObjectId(userId)
    });
    return {
      result,
      page,
      total_page: Math.ceil(total / limit)
    };
  }

  async addNewConversation(senderId: string, receiverId: string) {
    const checkConversation = await db.userConversations.findOne({
      user_id: new ObjectId(senderId),
      chat_with: new ObjectId(receiverId)
    });
    if (checkConversation) {
      throw new ErrorWithStatus({
        message: 'Conversation already exists',
        status: 400
      });
    }
    const newConversation = await db.userConversations.insertOne({
      user_id: new ObjectId(senderId),
      chat_with: new ObjectId(receiverId)
    });
    return newConversation;
  }

  async removeConversation(senderId: string, receiverId: string) {
    const newConversation = await db.userConversations.deleteOne({
      user_id: new ObjectId(senderId),
      chat_with: new ObjectId(receiverId)
    });
    return newConversation;
  }

  async getProjectConversation(projectId: string, limit: number, page: number) {
    const result = await db.conversations
      .aggregate([
        {
          $match: {
            receiver_id: new ObjectId(projectId)
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'Users', // Tên collection cần join
            localField: 'sender_id', // Field trong conversations
            foreignField: '_id', // Field trong users
            as: 'sender_info' // Tên field cho dữ liệu join
          }
        }
      ])
      .toArray();

    const total = await db.conversations.countDocuments({
      receiver_id: new ObjectId(projectId)
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
