import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { NextFunction, Request, Response } from 'express';
import pick from '../utils/pick';
import Joi from 'joi';

const validate = (schema: object) => (req: Request, res: Response, next: NextFunction) => {
  console.log('Validate middleware received request body:', JSON.stringify(req.body, null, 2));

  const validSchema = pick(schema, ['params', 'query', 'body']);
  const obj = pick(req, Object.keys(validSchema));

  console.log('Validated schema:', JSON.stringify(validSchema, null, 2));
  console.log('Picked object:', JSON.stringify(obj, null, 2));

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(obj);

  if (error) {
    console.error('Validation error:', error.details);
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  console.log('Validation successful, value:', JSON.stringify(value, null, 2));
  Object.assign(req, value);
  return next();
};

export default validate;
