import { checkSchema } from 'express-validator';
import { validate } from '~/utils/validation';

export const searchValidator = validate(
  checkSchema({
    key: {
      isString: { errorMessage: 'Từ khóa không hợp lệ' },
      trim: true,
      isLength: {
        errorMessage: 'Từ khoá phải có độ dài từ 1 đến 200 ký tự',
        options: { min: 1, max: 200 }
      }
    },
    limit: {
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
    },
    page: {
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
    }
  })
);
