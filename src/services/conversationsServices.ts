import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';
import { ErrorWithStatus } from '~/models/Errors';
import UserConversation from '~/models/schemas/UserConversation';

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

  async getChatUsers(userId: string) {
    const result = await db.userConversations
      .aggregate([
        {
          $match: {
            $or: [{ user_id_1: new ObjectId(userId) }, { user_id_2: new ObjectId(userId) }]
          }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'user_id_1',
            foreignField: '_id',
            as: 'user_1_info'
          }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'user_id_2',
            foreignField: '_id',
            as: 'user_2_info'
          }
        },
        {
          $sort: {
            'last_message.time': -1
          }
        }
      ])
      .toArray();

    return result;
  }

  async addNewConversation(senderId: string, receiverId: string) {
    const checkConversation = await db.userConversations.findOne({
      $or: [
        { user_id_1: new ObjectId(senderId), user_id_2: new ObjectId(receiverId) },
        { user_id_1: new ObjectId(receiverId), user_id_2: new ObjectId(senderId) }
      ]
    });

    if (checkConversation) {
      return checkConversation;
    }
    const newConversation = await db.userConversations.insertOne(
      new UserConversation({
        user_id_1: new ObjectId(senderId),
        user_id_2: new ObjectId(receiverId)
      })
    );
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

  async getDisputeConversation(disputeId: string, limit: number, page: number) {
    const result = await db.conversations
      .aggregate([
        {
          $match: {
            receiver_id: new ObjectId(disputeId)
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
            from: 'Users',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'sender_info'
          }
        }
      ])
      .toArray();

    const total = await db.conversations.countDocuments({
      receiver_id: new ObjectId(disputeId)
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
