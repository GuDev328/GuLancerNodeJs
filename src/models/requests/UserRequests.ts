import { JwtPayload } from 'jsonwebtoken';
import User from '../schemas/UserSchema';
import { RoleType } from '~/constants/enum';

export interface RegisterRequest {
  name: string;
  email: string;
  username: string;
  date_of_birth: string;
  phone_number: string;
  location: string;
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
  date_of_birth?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
  phone_number?: string;
  technology: string[];
  description_markdown?: string;
  description_html?: string;
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

export interface AddUsersToCircleRequest {
  decodeAuthorization: JwtPayload;
  userIds: string[];
}
