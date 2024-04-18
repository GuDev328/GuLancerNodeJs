import { JwtPayload } from 'jsonwebtoken';
import { Media, TweetTypeEnum } from '~/constants/enum';
import Tweet from '../schemas/TweetSchema';

export interface TweetRequest {
  decodeAuthorization: JwtPayload;
  user_id: string;
  group_id: string;
  type: TweetTypeEnum;
  content: string;
  parent_id: null | string;
  mentions: string[];
  medias: Media[];
}

export interface getTweetRequest {
  decodeAuthorization: JwtPayload;
  tweet_id: string;
}
