import express from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validations.run(req);

    const errors = validationResult(req);
    const errorObject = errors.mapped();

    for (const key in errorObject) {
      const { msg } = errorObject[key];
      if (msg instanceof ErrorWithStatus && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }
    }

    if (errors.isEmpty()) {
      return next();
    }
    const errorObj = errors.mapped();
    let errorMessage = '';

    for (const key in errorObj) {
      if (Object.prototype.hasOwnProperty.call(errorObj, key)) {
        errorMessage += `${errorObj[key].msg}, `;
      }
    }
    errorMessage = errorMessage.slice(0, -2);
    res.status(422).json({ message: errorMessage });
  };
};
