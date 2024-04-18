import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { ObjectId } from 'mongodb';
import { GroupTypes } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import db from '~/services/databaseServices';
import { validate } from '~/utils/validation';

export const createGroupValidator = validate(
  checkSchema({
    name: {
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
    },
    type: {
      notEmpty: { errorMessage: 'Kiểu hội nhóm không được để trống' },
      isIn: { options: [GroupTypes], errorMessage: 'Kiểu hội nhóm không hợp lệ' }
    },
    description: {
      isLength: {
        errorMessage: 'Mô tả phải có độ dài từ 1 đến 1000 ký tự',
        options: { min: 1, max: 1000 }
      }
    },
    cover_photo: {
      isString: { errorMessage: 'Ảnh bìa không hợp lệ' },
      isURL: { errorMessage: 'Ảnh bìa không hợp lệ' }
    }
  })
);
