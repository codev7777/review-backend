import { Request, Response } from 'express';
import { User, Role } from '@prisma/client';
import authService from '../services/auth.service';
import mailService from '../services/mail.service';
import userService from '../services/user.service';
import tokenService from '../services/token.service';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import crypto from 'crypto';

const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const user = await userService.createUser(email, password, name);

  // Create verification token
  const token = await tokenService.generateVerifyEmailToken(user);
  await mailService.sendVerificationEmail(user.email, token);

  res.status(httpStatus.CREATED).send({
    message: 'Registration successful. Please check your email to verify your account.'
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const token = await tokenService.generateResetPasswordToken(req.body.email);
  await mailService.sendResetPasswordEmail(req.body.email, token);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query.token as string, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.query;
  console.log(token);
  if (!token || typeof token !== 'string') {
    console.log('-----------------');
    throw new ApiError(httpStatus.BAD_REQUEST, 'Verification token is required');
  }
  console.log('+++++++++++++');
  await authService.verifyEmail(token);
  res.status(httpStatus.OK).send({ message: 'Email verified successfully' });
});

const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required');
  }

  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const verificationToken = await tokenService.generateVerifyEmailToken(user);
  await mailService.sendVerificationEmail(email, verificationToken);

  res.status(httpStatus.OK).send({
    message: 'Verification email has been resent. Please check your email.'
  });
});

const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as User;
  const verificationToken = await tokenService.generateVerifyEmailToken(user);
  await mailService.sendVerificationEmail(user.email, verificationToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  sendVerificationEmail
};
