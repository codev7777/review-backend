import httpStatus from 'http-status';
import pick from '../utils/pick';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';
import { User } from '@prisma/client';
import { encryptPassword } from '../utils/encryption';

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, role } = req.body;
  const user = await userService.createUser(email, password, name, role);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if the requesting user has access to view this user
  const requestingUser = req.user as User;
  if (!requestingUser) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  if (requestingUser.role !== 'ADMIN' && user.companyId !== requestingUser.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only view users in your company');
  }

  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateCurrentUserPassword = catchAsync(async (req, res) => {
  const user = req.user as User;
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const encryptedPassword = await encryptPassword(req.body.password);
  await userService.updateUserById(user.id, { password: encryptedPassword });
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateCurrentUserPassword
};
