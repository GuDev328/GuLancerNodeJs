import { JwtPayload } from 'jsonwebtoken';
import { Media, TweetTypeEnum } from '~/constants/enum';

export interface BookmarkRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
}
