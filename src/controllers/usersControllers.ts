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
