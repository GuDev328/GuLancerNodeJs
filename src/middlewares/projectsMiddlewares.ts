import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { ObjectId } from 'mongodb';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import { validate } from '~/utils/validation';

export const bookmarkValidator = validate(
  checkSchema({
    project_id: {
      isString: { errorMessage: 'Mã dự án không hợp lệ' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Mã dự án không hợp lệ'
            });
          }
          return true;
        }
      }
    }
  })
);

export const isAdminProjectValidator = validate(
  checkSchema({
    project_id: {
      isString: { errorMessage: 'Mã dự án không hợp lệ' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Mã dự án không hợp lệ'
            });
          }

          const project = await db.projects.findOne({
            _id: new ObjectId(value),
            admin_id: new ObjectId(req.body.decodeAuthorization.payload.userId)
          });

          if (!project) {
            throw new ErrorWithStatus({
              status: httpStatus.FORBIDDEN,
              message: 'Người dùng không phải là admin của dự án này'
            });
          }

          return true;
        }
      }
    }
  })
);

export const isMemberOrAdminProjectValidator = validate(
  checkSchema({
    id: {
      isString: { errorMessage: 'Mã dự án không hợp lệ' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Mã dự án không hợp lệ'
            });
          }

          const project = await db.projects.findOne({
            _id: new ObjectId(value),
            $or: [
              { admin_id: new ObjectId(req.body.decodeAuthorization.payload.userId) },
              { 'members.user_id': new ObjectId(req.body.decodeAuthorization.payload.userId) }
            ]
          });

          if (!project) {
            throw new ErrorWithStatus({
              status: httpStatus.FORBIDDEN,
              message: 'Người dùng không phải là thành viên hoặc admin của dự án này'
            });
          }

          return true;
        }
      }
    }
  })
);
