import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { request } from 'http';
import { JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { RoleType, TokenType } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { accessTokenValidate } from '~/utils/common';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: 'Yêu cầu authorization '
        },
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(' ')[1];
            await accessTokenValidate(accessToken, req as Request);
            return true;
          }
        }
      }
    },
    ['headers']
  )
);

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refreshToken: {
        notEmpty: {
          errorMessage: 'Yêu cầu refreshToken'
        },
        custom: {
          options: async (value: string, { req }) => {
            const refreshToken = req.body.refreshToken;
            try {
              const [decodeRefreshToken, checkInDB] = await Promise.all([
                verifyToken(refreshToken),
                db.refreshTokens.findOne({ token: refreshToken })
              ]);
              if (!checkInDB) {
                throw new ErrorWithStatus({
                  message: 'Refresh token không tồn tại',
                  status: httpStatus.NOT_FOUND
                });
              }
              req.body.decodeRefreshToken = decodeRefreshToken;
              if (decodeRefreshToken.payload.type !== TokenType.RefreshToken) {
                throw new ErrorWithStatus({
                  message: 'Kiểu của token không hợp lệ',
                  status: 401
                });
              }
            } catch (e: any) {
              throw new ErrorWithStatus({
                message: e.message,
                status: httpStatus.UNAUTHORIZED
              });
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: 'Không đúng định dạng email'
        },
        trim: true,
        notEmpty: {
          errorMessage: 'Email không được để trống'
        }
      },
      password: {
        trim: true,
        notEmpty: {
          errorMessage: 'Mật khẩu không được để trống'
        }
      }
    },
    ['body']
  )
);

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Độ dài của tên từ 1 đến 100 ký tự'
        },
        isString: true,
        notEmpty: {
          errorMessage: 'Tên không được để trống'
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: 'Email không được để trống'
        },
        isEmail: {
          errorMessage: 'Email không đúng định dạng'
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const result = await usersService.checkEmailExists(value);
            if (result) {
              throw new Error('Email đã tồn tại');
            }
            return true;
          }
        }
      },
      username: {
        notEmpty: {
          errorMessage: 'Username không được để trống'
        },
        trim: true,
        custom: {
          options: async (value: string) => {
            const result = await usersService.checkUsernameExists(value);
            if (result) {
              throw new Error('Username đã tồn tại');
            }
            return true;
          }
        }
      },
      phone_number: {
        notEmpty: { errorMessage: 'Số điện thoại không được để trống' },
        custom: {
          options: async (value: string) => {
            if (value.length !== 10 && value[0] !== '0') {
              throw new Error('Số điện thoại không đúng định dạng');
            }
            return true;
          }
        }
      },
      location: {
        isString: { errorMessage: 'Địa chỉ không đúng định dạng' },
        notEmpty: { errorMessage: 'Địa chỉ không được để trống' }
      },
      date_of_birth: {
        isISO8601: { options: { strict: true, strictSeparator: true } }
      },
      role: {
        notEmpty: { errorMessage: 'Role không được để trống' },
        isIn: {
          options: [[0, 1, 2, 3]],
          errorMessage: 'Role không hợp lệ'
        }
      }
    },
    ['body']
  )
);

export const forgotPasswordValidator = validate(
  checkSchema({
    email: {
      isEmail: { errorMessage: 'Email không đúng định dạng' },
      trim: true,
      notEmpty: { errorMessage: 'Email không được để trống' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkEmailExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'Không tìm thấy email này'
            });
          }
          req.body.user = user;
          return true;
        }
      }
    }
  })
);

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        notEmpty: {
          errorMessage: 'forgot_password_token không được để trống'
        },
        custom: {
          options: async (value: string, { req }) => {
            const forgot_password_token = req.body.forgot_password_token;
            const decodeForgotPasswordToken = await verifyToken(forgot_password_token);
            if (decodeForgotPasswordToken.payload.type !== TokenType.FogotPasswordToken) {
              throw new ErrorWithStatus({
                message: 'Kiểu của token không hợp lệ',
                status: 401
              });
            }

            const user = await db.users.findOne({ _id: new ObjectId(decodeForgotPasswordToken.payload.userId) });
            if (!user) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: 'Không tìm thấy user này'
              });
            }
            if (value !== user.forgot_password_token) {
              throw new ErrorWithStatus({
                status: httpStatus.UNAUTHORIZED,
                message: 'forgot_password_token không khớp nhau'
              });
            }
            req.body.user = user;
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema({
    password: {
      notEmpty: {
        errorMessage: 'Mật khẩu không được để trống'
      },
      trim: true,
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: 'Độ dài của mật khẩu từ 6 đến 50 ký tự'
      }
    },
    confirmPassword: {
      notEmpty: {
        errorMessage: 'Mật khẩu xác nhận không được để trống'
      },
      trim: true,
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Mật khẩu xác nhận không khớp với mật khẩu');
          }
          return true;
        }
      }
    }
  })
);

export const updateMeValidator = validate(
  checkSchema({
    name: {
      optional: true,
      isLength: {
        options: { min: 1, max: 100 },
        errorMessage: 'Độ dài của tên từ 1 đến 100 ký tự'
      },
      isString: true,
      notEmpty: {
        errorMessage: 'Tên không được để trống'
      },
      trim: true
    },
    date_of_birth: {
      optional: true,
      isISO8601: { options: { strict: true, strictSeparator: true } }
    },
    location: {
      optional: true,
      isString: { errorMessage: 'Địa chỉ không đúng định dạng' }
    },
    website: {
      optional: true,
      isURL: { errorMessage: 'Website không đúng định dạng' }
    },
    username: {
      optional: true,
      isString: { errorMessage: 'Username không đúng định dạng' },
      isLength: {
        options: { min: 1, max: 25 },
        errorMessage: 'Độ dài của username từ 1 đến 25 ký tự'
      },
      custom: {
        options: async (value: string, { req }) => {
          const result = await usersService.checkUsernameExists(value);
          if (result && result._id.toString() !== req.body.decodeAuthorization.payload.userId.toString()) {
            throw new Error('Username đã tồn tại');
          }

          return true;
        }
      }
    },
    avatar: {
      optional: true,
      isURL: { errorMessage: 'Avatar phải là 1 URL' },
      trim: true
    },
    cover_photo: {
      optional: true,
      isURL: { errorMessage: 'Ảnh bìa phải là 1 URL' },
      trim: true
    }
  })
);

export const getProfileValidator = validate(
  checkSchema({
    username: {
      isString: { errorMessage: 'Username phải là một chuỗi' },
      custom: {
        options: async (value: string, { req }) => {
          const result = await usersService.checkUsernameExists(value);
          if (!result) {
            throw new ErrorWithStatus({
              message: 'Không tìm thấy username này',
              status: httpStatus.NOT_FOUND
            });
          }
          req.body.user = result;
          return true;
        }
      }
    }
  })
);

export const followValidator = validate(
  checkSchema({
    userId: {
      notEmpty: { errorMessage: 'Mã người dùng không được để trống' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkUserIdExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'Không tìm thấy user này'
            });
          }
          return true;
        }
      }
    }
  })
);

export const unfollowValidator = validate(
  checkSchema({
    userId: {
      notEmpty: { errorMessage: 'Mã người nhận không được để trống' },
      custom: {
        options: async (value, { req }) => {
          const user = await usersService.checkUserIdExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'Không tìm thấy user này'
            });
          }
          return true;
        }
      }
    }
  })
);

export const changePasswordValidator = validate(
  checkSchema({
    oldPassword: {
      notEmpty: {
        errorMessage: 'Mật khẩu cũ không được để trống'
      },
      trim: true
    },
    newPassword: {
      notEmpty: {
        errorMessage: 'Mật khẩu mới không được để trống'
      },
      trim: true,
      isLength: {
        options: { min: 6, max: 50 },
        errorMessage: 'Độ dài của mật khẩu từ 6 đến 50 ký tự'
      }
    },
    confirmPassword: {
      notEmpty: {
        errorMessage: 'Mật khẩu xác nhận không được để trống'
      },
      trim: true,
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Mật khẩu xác nhận không khớp với mật khẩu');
          }
          return true;
        }
      }
    }
  })
);

export const isLoginValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next);
    }
    next();
  };
};

export const isAdminValidator = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body.decodeAuthorization.payload;
  if (role !== RoleType.Admin) {
    return next(
      new ErrorWithStatus({
        message: 'Bạn không có quyền ',
        status: httpStatus.FORBIDDEN
      })
    );
  }
  next();
};

export const getConversationsValidator = validate(
  checkSchema({
    receiverUserId: {
      notEmpty: {
        errorMessage: 'receiverUserId không được để trống'
      },
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new Error('Mã người nhận không đúng định dạng');
          }
          const user = await usersService.checkUserIdExists(value);
          if (!user) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'Không tìm thấy user này'
            });
          }
          return true;
        }
      }
    },
    limit: {
      isNumeric: { errorMessage: 'Limit phải là một số nguyên' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num > 50 || num < 1) {
            throw new Error('Limit không được lớn hơn 50 và nhỏ hơn 1');
          }
          return true;
        }
      }
    },
    page: {
      isNumeric: { errorMessage: 'Page phải là một số nguyên' },
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num < 1) {
            throw new Error('Page không được nhỏ hơn 1');
          }
          return true;
        }
      }
    }
  })
);

export const getEvaluationValidator = validate(
  checkSchema({
    page: {
      optional: true,
      isInt: { errorMessage: 'Page phải là một số nguyên' },
      toInt: true,
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num < 1) {
            throw new Error('Page không được nhỏ hơn 1');
          }
          return true;
        }
      }
    },
    limit: {
      optional: true,
      isInt: { errorMessage: 'Limit phải là một số nguyên' },
      toInt: true,
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num > 50 || num < 1) {
            throw new Error('Limit phải là một số lớn hơn 0 và nhỏ hơn 50');
          }
          return true;
        }
      }
    }
  })
);
