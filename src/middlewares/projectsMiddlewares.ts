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
