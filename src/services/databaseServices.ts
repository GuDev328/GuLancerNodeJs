import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import User from '~/models/schemas/UserSchema';
import Follower from '~/models/schemas/FollowerSchema';
import Bookmark from '~/models/schemas/BookmarkSchema';
import Like from '~/models/schemas/LikeSchema';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import Tweet from '~/models/schemas/TweetSchema';
import Conversation from '~/models/schemas/ConversationSchema';
import { env } from '~/constants/config';
import ApplyInvitation from '~/models/schemas/ApplyInvitation';
import Evaluation from '~/models/schemas/EvaluationSchema';
import Group from '~/models/schemas/GroupSchema';
import Member from '~/models/schemas/MemberSchema';
import Project from '~/models/schemas/ProjectSchema';
import Technology from '~/models/schemas/TechnologySchema';
import Field from '~/models/schemas/FieldSchema';
import UserConversation from '~/models/schemas/UserConversation';
import Task from '~/models/schemas/TaskSchema';
import MemberProject from '~/models/schemas/MemberProject';
import Payment from '~/models/schemas/PaymentSchema';
import HistoryAmount from '~/models/schemas/HistoryAmountSchema';
import Dispute from '~/models/schemas/DisputeSchema';
const uri = env.mongodbURI;

class DatabaseServices {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri!);
    this.db = this.client.db(env.dbName);
  }

  async connect() {
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
      console.log('Successfully connected to MongoDB!');
    } catch (e) {
      console.log(e);
    }
  }

  async indexUsersCollection() {
    if (!db.users.indexExists('username_text')) {
      await db.users.createIndex({ username: 'text' });
    }
    if (!db.users.indexExists('email_1')) {
      await db.users.createIndex({ email: 1 });
    }
  }

  async indexTweetsCollection() {
    if (!db.tweets.indexExists('user_id_1')) {
      await db.tweets.createIndex({ user_id: 1 });
    }
    if (!db.tweets.indexExists('parent_id_1')) {
      await db.tweets.createIndex({ parent_id: 1 });
    }
    if (!db.tweets.indexExists('content_text')) {
      await db.tweets.createIndex({ content: 'text' }, { default_language: 'none' });
    }
  }

  get users(): Collection<User> {
    return this.db.collection('Users');
  }
  get bookmarks(): Collection<Bookmark> {
    return this.db.collection('Bookmarks');
  }
  get followers(): Collection<Follower> {
    return this.db.collection('Followers');
  }
  get likes(): Collection<Like> {
    return this.db.collection('Likes');
  }
  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection('RefreshTokens');
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection('Tweets');
  }
  get conversations(): Collection<Conversation> {
    return this.db.collection('Conversations');
  }
  get applyInvitations(): Collection<ApplyInvitation> {
    return this.db.collection('ApplyInvitations');
  }
  get memberProject(): Collection<MemberProject> {
    return this.db.collection('MemberProject');
  }
  get disputes(): Collection<Dispute> {
    return this.db.collection('Disputes');
  }
  get payments(): Collection<Payment> {
    return this.db.collection('Payments');
  }
  get historyAmounts(): Collection<HistoryAmount> {
    return this.db.collection('HistoryAmounts');
  }
  get evaluations(): Collection<Evaluation> {
    return this.db.collection('Evaluations');
  }
  get groups(): Collection<Group> {
    return this.db.collection('Groups');
  }
  get members(): Collection<Member> {
    return this.db.collection('Members');
  }
  get projects(): Collection<Project> {
    return this.db.collection('Projects');
  }
  get technologies(): Collection<Technology> {
    return this.db.collection('Technologies');
  }
  get fields(): Collection<Field> {
    return this.db.collection('Fields');
  }
  get userConversations(): Collection<UserConversation> {
    return this.db.collection('UserConversations');
  }
  get tasks(): Collection<Task> {
    return this.db.collection('Tasks');
  }
}

const db = new DatabaseServices();
export default db;
