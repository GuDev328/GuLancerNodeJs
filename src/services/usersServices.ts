import {
  AddUsersToCircleRequest,
  ChangePasswordRequest,
  FollowRequest,
  ForgotPasswordRequest,
  GetMeRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResendVerifyEmailRequest,
  ResetPasswordRequest,
  UnfollowRequest,
  UpdateMeRequest,
  VerifyEmailRequest
} from '~/models/requests/UserRequests';
import bcrypt from 'bcrypt';
import User from '~/models/schemas/UserSchema';
import db from '~/services/databaseServices';
import { signToken, verifyToken } from '~/utils/jwt';
import { RoleType, SendEmail, TokenType } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import { ObjectId } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';
import { httpStatus } from '~/constants/httpStatus';
import Follower from '~/models/schemas/FollowerSchema';
import { sendEmail } from '~/utils/email';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { env } from '~/constants/config';
import { DateVi } from '~/utils/date-vi';

class UsersService {
  constructor() {}
  signAccessToken(userId: string, role: RoleType) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.AccessToken,
          role
        }
      },
      {
        expiresIn: env.accessTokenExpiresIn
      }
    );
  }

  signRefreshToken(userId: string, role: RoleType, expiresIn?: number) {
    return signToken(
      {
        payload: {
          userId,
          type: TokenType.RefreshToken
        }
      },
      {
        expiresIn: expiresIn || env.refreshTokenExporesIn
      }
    );
  }

  signForgotPasswordToken(userId: string) {
    return signToken({
      payload: {
        userId,
        type: TokenType.FogotPasswordToken
      }
    });
  }

  async login(payload: LoginRequest) {
    const user = await db.users.findOne({ email: payload.email });
    if (!user) {
      throw new ErrorWithStatus({
        status: 401,
        message: 'Không tìm thấy tài khoản'
      });
    } else {
      const checkPassword = await bcrypt.compareSync(payload.password, user.password);
      if (checkPassword) {
        const [accessToken, refreshToken] = await Promise.all([
          this.signAccessToken(user._id.toString(), user.role),
          this.signRefreshToken(user._id.toString(), user.role)
        ]);

        const saveRefreshToken = await db.refreshTokens.insertOne(
          new RefreshToken({
            token: refreshToken,
            created_at: DateVi(),
            user_id: user._id
          })
        );

        return {
          accessToken,
          refreshToken
        };
      } else {
        throw new ErrorWithStatus({
          status: 401,
          message: 'Mật khẩu không chính xác'
        });
      }
    }
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: env.googleClientID,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectURI,
      grant_type: 'authorization_code'
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data;
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data;
  }

  async loginGoogle(code: string) {
    const oauthGoogleToken = await this.getOauthGoogleToken(code);
    const googleUserInfo = await this.getGoogleUserInfo(oauthGoogleToken.access_token, oauthGoogleToken.id_token);
    if (!googleUserInfo.verified_email) {
      throw new ErrorWithStatus({
        message: 'Email chưa được xác thực',
        status: httpStatus.BAD_REQUEST
      });
    }

    const userInDb = await this.checkEmailExists(googleUserInfo.email);

    if (userInDb) {
      const [accessToken, refreshToken] = await Promise.all([
        this.signAccessToken(userInDb._id.toString(), userInDb.role),
        this.signRefreshToken(userInDb._id.toString(), userInDb.role)
      ]);
      await db.refreshTokens.insertOne(
        new RefreshToken({
          token: refreshToken,
          created_at: DateVi(),
          user_id: userInDb._id
        })
      );
      return {
        accessToken,
        refreshToken,
        newUser: false
      };
    } else {
      const usernameRandom = googleUserInfo.name.replace(/\s/g, '') + new Date().getTime() + nanoid(5);
      const { accessToken, refreshToken } = await this.register({
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        username: usernameRandom,
        date_of_birth: DateVi().toISOString(),
        phone_number: '',
        location: '',
        role: RoleType.Undefined
      });
      return {
        accessToken,
        refreshToken,
        newUser: true
      };
    }
  }

  async register(payload: RegisterRequest) {
    const randompassword = nanoid(10);
    const saltRounds = 10;
    const password = await bcrypt.hashSync(randompassword, saltRounds);

    const result = await db.users.insertOne(
      new User({
        ...payload,
        password,
        date_of_birth: new Date(payload.date_of_birth)
      })
    );
    const userId = result.insertedId.toString();
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(userId, payload.role),
      this.signRefreshToken(userId, payload.role)
    ]);
    const saveRefreshToken = await db.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        created_at: DateVi(),
        user_id: result.insertedId
      })
    );
    //sendEmail(payload.email, randompassword, SendEmail.Password);
    return {
      accessToken,
      refreshToken
    };
  }

  async refreshToken(payload: RefreshTokenRequest) {
    await db.refreshTokens.deleteOne({ token: payload.refreshToken });
    const refreshTokenEXP = (payload.decodeRefreshToken.exp as number) - Math.floor(Date.now() / 1000);
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(payload.decodeRefreshToken.payload.userId, payload.decodeRefreshToken.payload.role),
      this.signRefreshToken(
        payload.decodeRefreshToken.payload.userId,
        payload.decodeRefreshToken.payload.role,
        refreshTokenEXP
      )
    ]);

    const saveRefreshToken = await db.refreshTokens.insertOne(
      new RefreshToken({
        token: refreshToken,
        created_at: new Date(),
        user_id: new ObjectId(payload.decodeRefreshToken.payload.userId)
      })
    );

    return {
      accessToken,
      refreshToken
    };
  }

  async checkEmailExists(email: string) {
    const user = await db.users.findOne({ email });
    if (user) {
      return user;
    } else return false;
  }

  async checkUsernameExists(username: string) {
    const user = await db.users.findOne({ username });
    if (user) {
      return user;
    } else return false;
  }

  async checkUserIdExists(userId: string) {
    const user = await db.users.findOne({ _id: new ObjectId(userId) });
    if (user) {
      return user;
    } else return false;
  }

  async logout(payload: LogoutRequest) {
    const deleteRefresh = await db.refreshTokens.deleteOne({ token: payload.refreshToken });
    return;
  }

  async forgotPassword(payload: ForgotPasswordRequest) {
    const forgot_password_token = await this.signForgotPasswordToken(payload.user._id.toString());
    const save = await db.users.updateOne({ _id: payload.user._id }, [
      {
        $set: { forgot_password_token, updated_at: '$$NOW' }
      }
    ]);
    //await sendEmail(payload.user.email, forgot_password_token, SendEmail.FogotPassword);
    return;
  }

  async resetPassword(payload: ResetPasswordRequest) {
    const saltRounds = 10;
    const password = await bcrypt.hashSync(payload.password, saltRounds);
    const save = await db.users.updateOne(
      { _id: payload.user._id },
      {
        $set: {
          password,
          forgot_password_token: '',
          updated_at: DateVi()
        }
      }
    );
    return;
  }

  async getMe(payload: GetMeRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const user = await db.users.findOne(
      { _id: new ObjectId(userId) },
      {
        projection: {
          password: 0,
          forgot_password_token: 0
        }
      }
    );
    return user;
  }

  async updateMe(payload: UpdateMeRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const { decodeAuthorization, ...payloadWithOutJWT } = payload;
    const newPayload = payload.date_of_birth
      ? { ...payloadWithOutJWT, date_of_birth: new Date(payload.date_of_birth) }
      : payloadWithOutJWT;
    const user = await db.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          ...(newPayload as UpdateMeRequest & { date_of_birth: Date })
        }
      },
      {
        returnDocument: 'after',
        projection: {
          forgot_password_token: 0,
          password: 0
        }
      }
    );
    return user;
  }

  async follow(payload: FollowRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const followedUserId = new ObjectId(payload.userId);
    const result = await db.followers.insertOne(
      new Follower({
        user_id: userId,
        followed_user_id: followedUserId,
        created_at: DateVi()
      })
    );
  }

  async unfollow(payload: UnfollowRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const followedUserId = new ObjectId(payload.userId);
    const result = await db.followers.deleteOne({
      user_id: userId,
      followed_user_id: followedUserId
    });
    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: 'Chưa theo dõi người dùng này',
        status: httpStatus.NOT_FOUND
      });
    }
    return result;
  }

  async changePassword(payload: ChangePasswordRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const oldPassword = payload.oldPassword;
    const newPassword = payload.newPassword;

    const user = await db.users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy người dùng',
        status: httpStatus.NOT_FOUND
      });
    }
    const checkPassword = await bcrypt.compareSync(oldPassword, user.password);
    if (!checkPassword) {
      throw new ErrorWithStatus({
        message: 'Mật khẩu cũ không chính xác',
        status: httpStatus.UNAUTHORIZED
      });
    } else {
      const saltRounds = 10;
      const password = await bcrypt.hashSync(newPassword, saltRounds);
      const save = await db.users.findOneAndUpdate(
        {
          _id: new ObjectId(userId)
        },
        {
          $set: {
            password
          }
        }
      );
      return;
    }
  }
}

const usersService = new UsersService();
export default usersService;
