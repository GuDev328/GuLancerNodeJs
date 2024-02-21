import { checkSchema } from 'express-validator';
import { validate } from '~/utils/validation';

export const searchValidator = validate(
  checkSchema({
    key: {
      isString: { errorMessage: 'Key must be a string' },
      trim: true,
      isLength: {
        errorMessage: 'Key must be between 1 and 200 characters',
        options: { min: 1, max: 200 }
      }
    },
    limit: {
      isInt: { errorMessage: 'Limit must be an integer' },
      toInt: true,
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num > 50 || num < 1) {
            throw new Error('Limit must be between 1 and 50');
          }
          return true;
        }
      }
    },
    page: {
      isInt: { errorMessage: 'Page must be an integer' },
      toInt: true,
      custom: {
        options: (value: number) => {
          const num = Number(value);
          if (num < 1) {
            throw new Error('Page cannot be less than 1');
          }
          return true;
        }
      }
    }
  })
);
