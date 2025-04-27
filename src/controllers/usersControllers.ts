import { el } from '@faker-js/faker';
import exp from 'constants';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { pick } from 'lodash';
import { env } from '~/constants/config';
import {
  AddUsersToCircleRequest,
  ChangePasswordRequest,
  FollowRequest,
  ForgotPasswordRequest,
  GetListRequest,
  GetMeRequest,
  HandleVerifyRequest,
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
import userService from '~/services/usersServices';
import { DecodeAuthorization } from '~/models/requests/GroupRequest';
import { ObjectId } from 'mongodb';
import db from '~/services/databaseServices';
import { AccountStatus } from '~/constants/enum';
import { RoleType } from '~/constants/enum';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequest>, res: Response) => {
  const result = await userService.login(req.body);
  res.status(200).json({
    result,
    message: 'Login suscess'
  });
};

export const loginGoogleController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { code } = req.query;
  const result = await userService.loginGoogle(code as string);
  const urlRedirect = `${env.clientRedirectCallback}?access_token=${result.accessToken}&refresh_token=${result.refreshToken}&newUser=${result.newUser}`;
  res.redirect(urlRedirect);
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequest>, res: Response) => {
  const result = await userService.register(req.body);
  res.status(200).json({
    result,
    message: 'Register suscess'
  });
};

export const initRoleController = async (req: Request<ParamsDictionary, any, InitRoleRequest>, res: Response) => {
  const result = await userService.initRole(req.body);
  res.status(200).json({
    result,
    message: 'Init Role suscess'
  });
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutRequest>, res: Response) => {
  const result = await userService.logout(req.body);
  res.status(200).json({
    message: 'Logout suscess'
  });
};

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenRequest>,
  res: Response
) => {
  const result = await userService.refreshToken(req.body);
  res.status(200).json({
    result,
    message: 'refresh Token suscess'
  });
};

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequest>,
  res: Response
) => {
  const result = await userService.forgotPassword(req.body);
  res.status(200).json({
    result,
    message: 'Forgot password sucess'
  });
};

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Verify forgot password sucess'
  });
};

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequest>,
  res: Response
) => {
  const result = await userService.resetPassword(req.body);
  res.status(200).json({
    result,
    message: 'Reset password sucess'
  });
};

export const getMeController = async (req: Request<ParamsDictionary, any, GetMeRequest>, res: Response) => {
  const result = await userService.getMe(req.body);
  res.status(200).json({
    result,
    message: 'Get me sucess'
  });
};

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeRequest>, res: Response) => {
  const result = await userService.updateMe(req.body);
  res.status(200).json({
    result,
    message: 'Update me sucess'
  });
};

export const getProfileController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const {
    _id,
    name,
    email,
    date_of_birth,
    phone_number,
    description,
    bio,
    location,
    website,
    username,
    avatar,
    cover_photo,
    role,
    project_done,
    star
  } = req.body.user;
  res.status(200).json({
    result: {
      _id,
      name,
      email,
      date_of_birth,
      phone_number,
      description,
      bio,
      location,
      website,
      username,
      avatar,
      cover_photo,
      role,
      project_done,
      star
    },
    message: 'Get profile sucess'
  });
};

export const getProfileByIDController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.getProfileByID(id);
  res.status(200).json({
    result,
    message: 'Get profile by id sucess'
  });
};

export const followController = async (req: Request<ParamsDictionary, any, FollowRequest>, res: Response) => {
  const result = await userService.follow(req.body);
  res.status(200).json({
    message: 'Follow sucess'
  });
};

export const unfollowController = async (req: Request<ParamsDictionary, any, UnfollowRequest>, res: Response) => {
  const result = await userService.unfollow(req.body);
  res.status(200).json({
    message: 'Unfollow sucess'
  });
};

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordRequest>,
  res: Response
) => {
  const result = await userService.changePassword(req.body);
  res.status(200).json({
    result,
    message: 'Change Password sucess'
  });
};

export const getListAccount = async (req: Request<ParamsDictionary, any, GetListRequest>, res: Response) => {
  const { limit, page } = req.query;
  const result = await userService.getList(req.body, Number(page), Number(limit));
  res.status(200).json({
    ...result,
    message: 'Lấy danh sách tài khoản thành công'
  });
};

export const deleteAccountController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.body;
  const result = await userService.delete(id);
  res.status(200).json({
    result,
    message: 'Xoá thành công'
  });
};

export const blockAccountController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.body;
  const result = await db.users.updateOne({ _id: new ObjectId(id) }, { $set: { status: AccountStatus.Blocked } });
  res.status(200).json({
    result,
    message: 'Khóa tài khoản thành công'
  });
};

export const unblockAccountController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { id } = req.body;
  const result = await db.users.updateOne({ _id: new ObjectId(id) }, { $set: { status: AccountStatus.Active } });
  res.status(200).json({
    result,
    message: 'Mở khóa tài khoản thành công'
  });
};

export const requestVerifyController = async (
  req: Request<ParamsDictionary, any, RequestVerifyRequest>,
  res: Response
) => {
  const result = await userService.requestVerify(req.body);
  res.status(200).json({
    result,
    message: 'Gửi yêu cầu xác thực thành công'
  });
};

export const getListRequestVerifyController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { limit, page } = req.query;
  const { key } = req.body;
  const result = await userService.getListRequestVerify(key, Number(page), Number(limit));
  res.status(200).json({
    result,
    message: 'Lấy danh sách người dùng yêu cầu xác thực thành công'
  });
};

export const handleVerifyController = async (
  req: Request<ParamsDictionary, any, HandleVerifyRequest>,
  res: Response
) => {
  if (req.body.type === 'APPROVE') {
    userService.approveVerify(req.body.userId);
  } else {
    userService.rejectVerify(req.body.userId);
  }
  res.status(200).json({
    message: 'Xử lý xác thực thành công'
  });
};

export const getAmountInfoController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const result = await userService.amountInfo(new ObjectId(req.body.decodeAuthorization.payload.userId));
  res.status(200).json({
    result,
    message: 'Lấy thông tin thành công'
  });
};

export const getAmountHistoryController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const { page, limit } = req.query;
  const user_id = new ObjectId(req.body.decodeAuthorization.payload.userId);
  const result = await userService.getHistoryAmount(Number(page), Number(limit), user_id);
  res.status(200).json({
    result,
    message: 'Lấy biến động số dư thành công'
  });
};

export const getUserRegistrationStatsByMonthController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { month } = req.query;

  // Validate month format
  if (!month || !/^(0[1-9]|1[0-2])\/\d{4}$/.test(month as string)) {
    throw new ErrorWithStatus({
      message: 'Định dạng tháng không hợp lệ. Sử dụng định dạng MM/YYYY',
      status: httpStatus.BAD_REQUEST
    });
  }

  const [monthStr, yearStr] = (month as string).split('/');
  const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0, 23, 59, 59);

  const pipeline = [
    {
      $match: {
        created_at: {
          $gte: startDate,
          $lte: endDate
        },
        role: {
          $in: [RoleType.Freelancer, RoleType.Employer]
        }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        role: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', RoleType.Freelancer] }, then: 'Freelancer' },
              { case: { $eq: ['$_id', RoleType.Employer] }, then: 'Employer' }
            ],
            default: 'Unknown'
          }
        },
        count: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const statistics = await db.users.aggregate(pipeline).toArray();

  return res.status(200).json({
    message: 'Lấy thống kê người dùng đăng ký mới thành công',
    result: statistics
  });
};

export const getOverallUserStatisticsController = async (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const pipeline = [
    {
      $match: {
        role: {
          $in: [RoleType.Freelancer, RoleType.Employer]
        }
      }
    },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        role: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', RoleType.Freelancer] }, then: 'Freelancer' },
              { case: { $eq: ['$_id', RoleType.Employer] }, then: 'Employer' }
            ],
            default: 'Unknown'
          }
        },
        count: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const statistics = await db.users.aggregate(pipeline).toArray();

  return res.status(200).json({
    message: 'Lấy thống kê người dùng thành công',
    result: statistics
  });
};

export const getUserRegistrationStatsByYearController = async (
  req: Request<ParamsDictionary, any, any>,
  res: Response
) => {
  const { year } = req.query;

  // Validate year format
  if (!year || !/^\d{4}$/.test(year as string)) {
    throw new ErrorWithStatus({
      message: 'Định dạng năm không hợp lệ. Sử dụng định dạng YYYY',
      status: httpStatus.BAD_REQUEST
    });
  }

  const yearNum = parseInt(year as string);
  const startDate = new Date(yearNum, 0, 1); // January 1st
  const endDate = new Date(yearNum, 11, 31, 23, 59, 59); // December 31st

  const pipeline = [
    {
      $match: {
        created_at: {
          $gte: startDate,
          $lte: endDate
        },
        role: {
          $in: [RoleType.Freelancer, RoleType.Employer]
        }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$created_at' },
          role: '$role'
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        role: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id.role', RoleType.Freelancer] }, then: 'Freelancer' },
              { case: { $eq: ['$_id.role', RoleType.Employer] }, then: 'Employer' }
            ],
            default: 'Unknown'
          }
        },
        count: 1
      }
    },
    {
      $sort: { month: 1, role: 1 }
    }
  ];

  const statistics = await db.users.aggregate(pipeline).toArray();

  // Create a complete dataset with all months and roles
  const completeStats = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStats = statistics.filter((stat) => stat.month === month);
    const freelancerCount = monthStats.find((stat) => stat.role === 'Freelancer')?.count || 0;
    const employerCount = monthStats.find((stat) => stat.role === 'Employer')?.count || 0;

    return {
      month,
      data: [
        { role: 'Freelancer', count: freelancerCount },
        { role: 'Employer', count: employerCount }
      ]
    };
  });

  return res.status(200).json({
    message: 'Lấy thống kê người dùng đăng ký mới theo năm thành công',
    result: completeStats
  });
};
