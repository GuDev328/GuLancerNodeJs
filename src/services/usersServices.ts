import {
  AddUsersToCircleRequest,
  ChangePasswordRequest,
  FollowRequest,
  ForgotPasswordRequest,
  GetListRequest,
  GetMeRequest,
  InitRoleRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RequestVerifyRequest,
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
import { AccountSortBy, RoleType, SendEmail, TokenType, VerifyStatus } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { RefreshToken } from '~/models/schemas/RefreshTokenSchema';
import { ObjectId } from 'mongodb';
import { JwtPayload } from 'jsonwebtoken';
import { httpStatus } from '~/constants/httpStatus';
import Follower from '~/models/schemas/FollowerSchema';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { env } from '~/constants/config';
import { DateVi } from '~/utils/date-vi';
import Field from '~/models/schemas/FieldSchema';
import Technology from '~/models/schemas/TechnologySchema';
import { sendPasswordEmail } from '~/utils/email';
import { sendResetPasswordEmail } from '../utils/email';

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
        newUser: userInDb.role === RoleType.Undefined ? true : false
      };
    } else {
      const usernameRandom = googleUserInfo.name.replace(/\s/g, '') + new Date().getTime() + nanoid(5);
      const { accessToken, refreshToken } = await this.register({
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        username: usernameRandom,
        avatar: googleUserInfo.picture,
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
    sendPasswordEmail(payload.email, payload.name, randompassword);
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

    sendResetPasswordEmail(payload.user.email, payload.user.name, forgot_password_token);

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
    const user = await db.users
      .aggregate([
        {
          $match: { _id: new ObjectId(userId) }
        },
        {
          $lookup: {
            from: 'Fields',
            localField: 'fields',
            foreignField: '_id',
            as: 'fields_info'
          }
        },
        {
          $lookup: {
            from: 'Technologies',
            localField: 'technologies',
            foreignField: '_id',
            as: 'technologies_info'
          }
        },
        {
          $project: {
            password: 0,
            forgot_password_token: 0
          }
        }
      ])
      .toArray();
    return user[0];
  }

  async updateMe(payload: UpdateMeRequest) {
    const userId = payload.decodeAuthorization.payload.userId;
    const { decodeAuthorization, ...payloadWithOutJWT } = payload;
    let fieldsFinds: ObjectId[] = [];
    let techsFinds: ObjectId[] = [];
    if (payload.fields && payload.fields.length > 0) {
      fieldsFinds = await Promise.all(
        payload.fields.map(async (field) => {
          const fieldFind = await db.fields.findOne<Field>({ name: field });
          if (!fieldFind) {
            const init = await db.fields.insertOne(new Field({ name: field }));
            return new ObjectId(init.insertedId);
          } else {
            return fieldFind._id;
          }
        })
      );
    }
    if (payload.technologies && payload.technologies.length > 0) {
      techsFinds = await Promise.all(
        payload.technologies.map(async (tech) => {
          const techFind = await db.technologies.findOne<Technology>({ name: tech });
          if (!techFind) {
            const init = await db.technologies.insertOne(new Technology({ name: tech }));
            return new ObjectId(init.insertedId);
          } else {
            return new ObjectId(techFind._id);
          }
        })
      );
    }
    const newPayload = payload.date_of_birth
      ? {
          ...payloadWithOutJWT,
          date_of_birth: new Date(payload.date_of_birth),
          technologies: techsFinds,
          fields: fieldsFinds
        }
      : payloadWithOutJWT;

    const user = await db.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          ...(newPayload as UpdateMeRequest & { date_of_birth: Date; technologies: ObjectId[]; fields: ObjectId[] })
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
    const userId = new ObjectId(payload.decodeAuthorization.payload.userId);
    const followedUserId = new ObjectId(payload.userId);
    const follower = await db.followers.findOne({
      user_id: userId,
      followed_user_id: followedUserId
    });
    if (follower)
      throw new ErrorWithStatus({
        status: httpStatus.BAD_REQUEST,
        message: 'Bạn đã theo dõi người dùng này'
      });
    const result = await db.followers.insertOne(
      new Follower({
        user_id: userId,
        followed_user_id: followedUserId,
        created_at: DateVi()
      })
    );
  }

  async unfollow(payload: UnfollowRequest) {
    const userId = new ObjectId(payload.decodeAuthorization.payload.userId);
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

  async initRole(payload: InitRoleRequest) {
    const { decodeAuthorization, role } = payload;
    const userId = decodeAuthorization.payload.userId;
    const user = await db.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          role: role
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

  async getProfileByID(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new ErrorWithStatus({
        message: 'ID không hợp lệ',
        status: httpStatus.BAD_REQUEST
      });
    }
    const userFind = await db.users.findOne({ _id: new ObjectId(id) });
    if (!userFind) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy người dùng',
        status: httpStatus.NOT_FOUND
      });
    }
    const user = await db.users
      .aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: {
            from: 'Fields',
            localField: 'fields',
            foreignField: '_id',
            as: 'fields_info'
          }
        },
        {
          $lookup: {
            from: 'Technologies',
            localField: 'technologies',
            foreignField: '_id',
            as: 'technologies_info'
          }
        },
        {
          $lookup: {
            from: 'Evaluations',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$user_id', '$$userId'] }
                }
              },
              {
                $group: {
                  _id: null,
                  averageStar: { $avg: '$star' }
                }
              }
            ],
            as: 'evaluations'
          }
        },
        {
          $addFields: {
            [`star`]: {
              $toDecimal: { $ifNull: [{ $arrayElemAt: ['$evaluations.averageStar', 0] }, 5.0] }
            }
          }
        },
        {
          $project: {
            evaluations: 0
          }
        },
        {
          $project: {
            password: 0,
            forgot_password_token: 0
          }
        }
      ])
      .toArray();

    return user[0];
  }

  async getList(payload: GetListRequest, page: number, limit: number) {
    const regexPattern = new RegExp(payload.key, 'i');
    const [result, countUser] = await Promise.all([
      db.users
        .aggregate([
          {
            $match: {
              $or: [
                { username: { $regex: regexPattern } },
                { name: { $regex: regexPattern } },
                { email: { $regex: regexPattern } }
              ],
              ...(payload.role !== undefined && payload.role !== '' ? { role: payload.role } : {})
            }
          },
          ...(payload.sortBy === AccountSortBy.Star
            ? [{ $sort: { star: -1 } }]
            : payload.sortBy === AccountSortBy.ProjectDone
              ? [{ $sort: { project_done: -1 } }]
              : []),
          {
            $project: {
              password: 0,
              created_at: 0,
              emailVerifyToken: 0,
              forgot_password_token: 0,
              updated_at: 0,
              twitter_circle: 0
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),

      db.users.countDocuments({
        $or: [
          { username: { $regex: regexPattern } },
          { name: { $regex: regexPattern } },
          { email: { $regex: regexPattern } }
        ],
        ...(payload.role !== undefined && payload.role !== '' ? { role: payload.role } : {})
      })
    ]);

    return {
      total_page: Math.ceil(countUser / limit),
      page,
      limit,
      result
    };
  }

  async delete(id: string) {
    return db.users.deleteOne({ _id: new ObjectId(new ObjectId(id)) });
  }

  async requestVerify(payload: RequestVerifyRequest) {
    await db.users.findOneAndUpdate(
      {
        _id: new ObjectId(payload.decodeAuthorization.payload.userId)
      },
      {
        $set: {
          verified_info: {
            status: VerifyStatus.Pending,
            img_front: payload.img_front,
            img_back: payload.img_back,
            vid_portrait: payload.vid_portrait
          }
        }
      }
    );
    return;
  }

  async getListRequestVerify(key: string, page: number, limit: number) {
    const regexPattern = new RegExp(key, 'i');
    const [result, countUser] = await Promise.all([
      db.users
        .aggregate([
          {
            $match: {
              $or: [
                { username: { $regex: regexPattern } },
                { name: { $regex: regexPattern } },
                { email: { $regex: regexPattern } }
              ],
              'verified_info.status': VerifyStatus.Pending
            }
          },

          {
            $project: {
              password: 0,
              created_at: 0,
              emailVerifyToken: 0,
              forgot_password_token: 0,
              updated_at: 0,
              twitter_circle: 0
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),

      db.users.countDocuments({
        $or: [
          { username: { $regex: regexPattern } },
          { name: { $regex: regexPattern } },
          { email: { $regex: regexPattern } }
        ]
      })
    ]);

    return {
      total_page: Math.ceil(countUser / limit),
      page,
      limit,
      result
    };
  }
  async approveVerify(userId: string) {
    return db.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          'verified_info.status': VerifyStatus.Approved
        }
      }
    );
  }
  async rejectVerify(userId: string) {
    return db.users.findOneAndUpdate(
      {
        _id: new ObjectId(userId)
      },
      {
        $set: {
          'verified_info.status': VerifyStatus.Rejected,
          'verified_info.img_front': '',
          'verified_info.img_back': '',
          'verified_info.vid_portrait': ''
        }
      }
    );
  }

  async amountInfo(user_id: ObjectId) {
    const user = await db.users.findOne({ _id: user_id });
    if (!user)
      throw new ErrorWithStatus({
        message: 'Không tìm thấy dữ liệu của người dùng này.',
        status: httpStatus.NOT_FOUND
      });
    if (user.role === RoleType.Employer) {
      const project_ids = (await db.projects.find({ admin_id: user_id }).toArray()).map((item) => item._id);
      const member_project = await db.memberProject.find({ project_id: { $in: project_ids } }).toArray();
      const escrowing = member_project.reduce((sum, item) => sum + item.escrowed, 0);
      return {
        amount: user.amount,
        escrowing
      };
    } else {
      return {
        amount: user.amount,
        escrowing: null
      };
    }
  }

  async getPaymentOrders(page: number, limit: number, user_id: ObjectId) {
    const skip = (page - 1) * limit;
    const orders = await db.payments.find({ user_id }).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
    const totalRecord = await db.payments.countDocuments({ user_id });
    const totalPage = Math.ceil(totalRecord / limit);
    return {
      page,
      limit,
      totalRecord,
      totalPage,
      orders
    };
  }

  async getHistoryAmount(page: number, limit: number, user_id: ObjectId) {
    const skip = (page - 1) * limit;
    const orders = await db.historyAmounts.find({ user_id }).sort({ created_at: -1 }).skip(skip).limit(limit).toArray();
    const totalRecord = await db.historyAmounts.countDocuments({ user_id });
    const totalPage = Math.ceil(totalRecord / limit);
    return {
      page,
      limit,
      totalRecord,
      totalPage,
      orders
    };
  }
}

const usersService = new UsersService();
export default usersService;
