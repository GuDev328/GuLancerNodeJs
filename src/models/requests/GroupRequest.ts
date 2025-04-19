import { JwtPayload } from 'jsonwebtoken';
import { GroupTypes } from '~/constants/enum';

export interface CreateGroupRequest {
  decodeAuthorization: JwtPayload;
  name: string;
  type: GroupTypes;
  description: string;
  cover_photo: string;
}

export interface EditGroupRequest {
  decodeAuthorization: JwtPayload;
  group_id: string;
  name: string;
  censor: boolean;
  type: GroupTypes;
  description: string;
  cover_photo: string;
}

export interface DecodeAuthorization {
  decodeAuthorization: JwtPayload;
}

export interface GroupID extends DecodeAuthorization {
  group_id: string;
}
