import { JwtPayload } from 'jsonwebtoken';
import User from '../schemas/UserSchema';
import { AccountSortBy, GenderEnum, RoleType } from '~/constants/enum';

export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
  avatar?: string;
  date_of_birth: string;
  phone_number: string;
  location: string;
  role: RoleType;
}

export interface InitRoleRequest {
  decodeAuthorization: JwtPayload;
  role: RoleType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface RefreshTokenRequest {
  decodeRefreshToken: JwtPayload;
  refreshToken: string;
}

export interface VerifyEmailRequest {
  emailVerifyToken: string;
  decodeEmailVerifyToken: JwtPayload;
}

export interface ResendVerifyEmailRequest {
  decodeAuthorization: JwtPayload;
}

export interface ForgotPasswordRequest {
  email: string;
  user: User;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
  user: User;
}

export interface GetMeRequest {
  decodeAuthorization: JwtPayload;
}

export interface UpdateMeRequest {
  decodeAuthorization: JwtPayload;
  name?: string;
  gender?: GenderEnum;
  date_of_birth?: string;
  bio?: string;
  location?: string;
  salary?: number;
  website?: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
  phone_number?: string;
  technologies: string[];
  description?: string;
  fields: string[];
}

export interface FollowRequest {
  decodeAuthorization: JwtPayload;
  userId: string;
}

export interface UnfollowRequest {
  decodeAuthorization: JwtPayload;
  userId: string;
}

export interface ChangePasswordRequest {
  decodeAuthorization: JwtPayload;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface GetListRequest {
  key: string;
  role: number | string;
  sortBy: AccountSortBy;
}

export interface HandleVerifyRequest {
  type: 'APPROVE' | 'REJECT';
  userId: string;
}

export interface RequestVerifyRequest {
  decodeAuthorization: JwtPayload;
  img_front: string;
  img_back: string;
  vid_portrait: string;
}

export interface AddUsersToCircleRequest {
  decodeAuthorization: JwtPayload;
  userIds: string[];
}
