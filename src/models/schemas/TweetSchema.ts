import { ObjectId } from 'mongodb';
import { Media, TweetTypeEnum } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface TweetType {
  _id?: ObjectId;
  user_id: ObjectId;
  group_id: ObjectId;
  type: TweetTypeEnum;
  content: string;
  parent_id: null | ObjectId; //  chỉ null khi tweet gốc
  mentions: ObjectId[];
  medias: Media[];
  views?: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Tweet {
  _id: ObjectId;
  user_id: ObjectId;
  group_id: ObjectId;
  type: TweetTypeEnum;
  content: string;
  parent_id: null | ObjectId; //  chỉ null khi tweet gốc
  mentions: ObjectId[];
  medias: Media[];
  views: number;
  created_at: Date;
  updated_at: Date;

  constructor(tweet: TweetType) {
    this._id = tweet._id || new ObjectId();
    this.user_id = tweet.user_id || new ObjectId();
    this.group_id = tweet.group_id || new ObjectId();
    this.type = tweet.type || TweetTypeEnum.Tweet;
    this.content = tweet.content || '';
    this.parent_id = tweet.parent_id || null; //  chỉ null khi tweet gốc
    this.mentions = tweet.mentions || [];
    this.medias = tweet.medias || [];
    this.views = 0;
    this.created_at = tweet.created_at || DateVi();
    this.updated_at = tweet.updated_at || DateVi();
  }
}
