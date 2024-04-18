import { JwtPayload } from 'jsonwebtoken';
import { Media, TweetAudience, TweetTypeEnum } from '~/constants/enum';

export interface LikeRequest {
  decodeAuthorization: JwtPayload;
  tweet_id: string;
}
