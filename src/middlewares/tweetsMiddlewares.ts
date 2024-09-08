import { Request, Response, NextFunction } from 'express';
import { body, checkSchema } from 'express-validator';
import { request } from 'http';
import { JwtPayload } from 'jsonwebtoken';
import { isEmpty } from 'lodash';
import { ObjectId } from 'mongodb';
import { TokenType, TweetTypeEnum, MediaType, Media } from '~/constants/enum';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import Tweet from '~/models/schemas/TweetSchema';
import db from '~/services/databaseServices';
import usersService from '~/services/usersServices';
import { numberEnumtoArray } from '~/utils/common';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';

const TweetTypes = numberEnumtoArray(TweetTypeEnum);
const MediaTypes = numberEnumtoArray(MediaType);

export const createTweetValidator = validate(
  checkSchema({
    group_id: {
      notEmpty: {
        errorMessage: 'Phải truyền mã hội nhóm'
      },
      custom: {
        options: async (value: string, { req }) => {
          const group = await db.groups.findOne({ _id: new ObjectId(value) });
          if (!group) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Không tìm thấy hội nhóm này'
            });
          }
          return true;
        }
      }
    },
    type: {
      custom: {
        options: async (value: string, { req }) => {
          if (!TweetTypes.includes(parseInt(value))) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Kiểu bài đăng không hợp lệ'
            });
          }
          return true;
        }
      }
    },
    content: {
      isString: { errorMessage: 'Nội dung bài đăng phải là một chuỗi' }
      // custom: {
      //   options: async (value: string, { req }) => {
      //     const type = req.body.type as TweetTypeEnum;
      //     if (type === TweetTypeEnum.Retweet) {
      //       if (value !== '') {
      //         throw new ErrorWithStatus({
      //           status: httpStatus.UNPROCESSABLE_ENTITY,
      //           message: 'Nội dung bài chia sẻ phải rỗng'
      //         });
      //       }
      //     } else if (
      //       (type === TweetTypeEnum.Comment || type === TweetTypeEnum.Tweet) &&
      //       isEmpty(req.body.mentions) &&
      //       value === ''
      //     ) {
      //       throw new ErrorWithStatus({
      //         status: httpStatus.UNPROCESSABLE_ENTITY,
      //         message: 'Yêu cầu nhập nội dung bài đăng'
      //       });
      //     }
      //     return true;
      //   }
      // }
    },
    parent_id: {
      custom: {
        options: async (value: string, { req }) => {
          const type = req.body.type as TweetTypeEnum;
          if (type === TweetTypeEnum.Retweet || type === TweetTypeEnum.Comment) {
            const parent_id = req.body.parent_id;
            if (parent_id) {
              const parentTweet = await db.tweets.findOne({ _id: new ObjectId(parent_id) });
              if (!parentTweet) {
                throw new ErrorWithStatus({
                  status: httpStatus.NOT_FOUND,
                  message: 'Không tìm thấy bài đăng gốc'
                });
              }
            } else {
              throw new ErrorWithStatus({
                status: httpStatus.UNPROCESSABLE_ENTITY,
                message: 'Yêu cầu truyền mã bài đăng gốc'
              });
            }
          } else if (type === TweetTypeEnum.Tweet) {
            const parent_id = req.body.parent_id;
            if (parent_id) {
              throw new ErrorWithStatus({
                status: httpStatus.UNPROCESSABLE_ENTITY,
                message: 'Mã bài đăng gốc không được truyền'
              });
            }
          }
          return true;
        }
      }
    },

    mentions: {
      isArray: { errorMessage: 'mentions phải là 1 mảng chuỗi' },
      custom: {
        options: async (value: string[], { req }) => {
          if (!value.every((mention) => ObjectId.isValid(mention))) {
            throw new ErrorWithStatus({
              message: 'mentions phải là 1 mảng chuỗi',
              status: httpStatus.UNPROCESSABLE_ENTITY
            });
          }
        }
      }
    },
    medias: {
      isArray: { errorMessage: 'medias phải là 1 mảng' },
      custom: {
        options: async (value: Media[], { req }) => {
          if (
            !value.every((media) => {
              return typeof media.url === 'string' && MediaTypes.includes(media.type);
            })
          ) {
            throw new ErrorWithStatus({
              message: 'Media phải là 1 mảng đối tượng với MediaType',
              status: httpStatus.UNPROCESSABLE_ENTITY
            });
          }
        }
      }
    }
  })
);

export const tweetIdValidator = validate(
  checkSchema({
    id: {
      isString: { errorMessage: 'Mã bài đăng không hợp lệ' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Mã bài đăng không hợp lệ'
            });
          }
          req.body.tweet_id = value;
          return true;
        }
      }
    }
  })
);

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: { options: [TweetTypeEnum], errorMessage: 'Kiểu bài đăng không hợp lệ' }
    },
    limit: {
      isNumeric: { errorMessage: 'Limit phải là một số' },
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
      isNumeric: { errorMessage: 'Page phải là một số' },
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

export const getNewsFeedValidator = validate(
  checkSchema({
    limit: {
      isNumeric: { errorMessage: 'Limit phải là một số' },
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
      isNumeric: { errorMessage: 'Page phải là một số' },
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

export const likeValidator = validate(
  checkSchema({
    tweet_id: {
      isString: { errorMessage: 'Mã bài đăng không hợp lệ' },
      custom: {
        options: async (value: string, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new ErrorWithStatus({
              status: httpStatus.UNPROCESSABLE_ENTITY,
              message: 'Mã bài đăng không hợp lệ'
            });
          }
          const tweet = await db.tweets.findOne({ _id: new ObjectId(value) });
          if (!tweet) {
            throw new ErrorWithStatus({
              status: httpStatus.NOT_FOUND,
              message: 'Không tìm thấy bài đăng'
            });
          }
          return true;
        }
      }
    }
  })
);
