import { JwtPayload } from 'jsonwebtoken';

export interface LikeRequest {
  decodeAuthorization: JwtPayload;
  tweet_id: string;
}
