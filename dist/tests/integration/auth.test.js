"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const faker_1 = require("@faker-js/faker");
const http_status_1 = __importDefault(require("http-status"));
const node_mocks_http_1 = __importDefault(require("node-mocks-http"));
const moment_1 = __importDefault(require("moment"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_1 = __importDefault(require("../../src/app"));
const config_1 = __importDefault(require("../../src/config/config"));
const auth_1 = __importDefault(require("../../src/middlewares/auth"));
const services_1 = require("../../src/services");
const ApiError_1 = __importDefault(require("../../src/utils/ApiError"));
const setupTestDb_1 = __importDefault(require("../utils/setupTestDb"));
const globals_1 = require("@jest/globals");
const user_fixture_1 = require("../fixtures/user.fixture");
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../src/client"));
const roles_1 = require("../../src/config/roles");
(0, setupTestDb_1.default)();
(0, globals_1.describe)('Auth routes', () => {
    (0, globals_1.describe)('POST /v1/auth/register', () => {
        let newUser;
        (0, globals_1.beforeEach)(() => {
            newUser = {
                email: faker_1.faker.internet.email().toLowerCase(),
                password: 'password1'
            };
        });
        (0, globals_1.test)('should return 201 and successfully register user if request data is ok', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/register')
                .send(newUser)
                .expect(http_status_1.default.CREATED);
            (0, globals_1.expect)(res.body.user).not.toHaveProperty('password');
            (0, globals_1.expect)(res.body.user).toEqual({
                id: globals_1.expect.anything(),
                name: null,
                email: newUser.email,
                role: client_1.Role.USER,
                isEmailVerified: false
            });
            const dbUser = await client_2.default.user.findUnique({ where: { id: res.body.user.id } });
            (0, globals_1.expect)(dbUser).toBeDefined();
            (0, globals_1.expect)(dbUser === null || dbUser === void 0 ? void 0 : dbUser.password).not.toBe(newUser.password);
            (0, globals_1.expect)(dbUser).toMatchObject({
                name: null,
                email: newUser.email,
                role: client_1.Role.USER,
                isEmailVerified: false
            });
            (0, globals_1.expect)(res.body.tokens).toEqual({
                access: { token: globals_1.expect.anything(), expires: globals_1.expect.anything() },
                refresh: { token: globals_1.expect.anything(), expires: globals_1.expect.anything() }
            });
        });
        (0, globals_1.test)('should return 400 error if email is invalid', async () => {
            newUser.email = 'invalidEmail';
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/register').send(newUser).expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 400 error if email is already used', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            newUser.email = user_fixture_1.userOne.email;
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/register').send(newUser).expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 400 error if password length is less than 8 characters', async () => {
            newUser.password = 'passwo1';
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/register').send(newUser).expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 400 error if password does not contain both letters and numbers', async () => {
            newUser.password = 'password';
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/register').send(newUser).expect(http_status_1.default.BAD_REQUEST);
            newUser.password = '11111111';
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/register').send(newUser).expect(http_status_1.default.BAD_REQUEST);
        });
    });
    (0, globals_1.describe)('POST /v1/auth/login', () => {
        (0, globals_1.test)('should return 200 and login user if email and password match', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const loginCredentials = {
                email: user_fixture_1.userOne.email,
                password: user_fixture_1.userOne.password
            };
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/login')
                .send(loginCredentials)
                .expect(http_status_1.default.OK);
            (0, globals_1.expect)(res.body.user).toMatchObject({
                id: globals_1.expect.anything(),
                name: user_fixture_1.userOne.name,
                email: user_fixture_1.userOne.email,
                role: user_fixture_1.userOne.role,
                isEmailVerified: user_fixture_1.userOne.isEmailVerified
            });
            (0, globals_1.expect)(res.body.user).toEqual(globals_1.expect.not.objectContaining({ password: globals_1.expect.anything() }));
            (0, globals_1.expect)(res.body.tokens).toEqual({
                access: { token: globals_1.expect.anything(), expires: globals_1.expect.anything() },
                refresh: { token: globals_1.expect.anything(), expires: globals_1.expect.anything() }
            });
        });
        (0, globals_1.test)('should return 401 error if there are no users with that email', async () => {
            const loginCredentials = {
                email: user_fixture_1.userOne.email,
                password: user_fixture_1.userOne.password
            };
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/login')
                .send(loginCredentials)
                .expect(http_status_1.default.UNAUTHORIZED);
            (0, globals_1.expect)(res.body).toEqual({
                code: http_status_1.default.UNAUTHORIZED,
                message: 'Incorrect email or password'
            });
        });
        (0, globals_1.test)('should return 401 error if password is wrong', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const loginCredentials = {
                email: user_fixture_1.userOne.email,
                password: 'wrongPassword1'
            };
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/login')
                .send(loginCredentials)
                .expect(http_status_1.default.UNAUTHORIZED);
            (0, globals_1.expect)(res.body).toEqual({
                code: http_status_1.default.UNAUTHORIZED,
                message: 'Incorrect email or password'
            });
        });
    });
    (0, globals_1.describe)('POST /v1/auth/logout', () => {
        (0, globals_1.test)('should return 204 if refresh token is valid', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await services_1.tokenService.saveToken(refreshToken, dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/logout')
                .send({ refreshToken })
                .expect(http_status_1.default.NO_CONTENT);
            const dbRefreshTokenData = await client_2.default.token.findFirst({ where: { token: refreshToken } });
            (0, globals_1.expect)(dbRefreshTokenData).toBe(null);
        });
        (0, globals_1.test)('should return 400 error if refresh token is missing from request body', async () => {
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/logout').send().expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 404 error if refresh token is not found in the database', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/logout')
                .send({ refreshToken })
                .expect(http_status_1.default.NOT_FOUND);
        });
        (0, globals_1.test)('should return 404 error if refresh token is blacklisted', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await services_1.tokenService.saveToken(refreshToken, dbUserOne.id, expires, client_1.TokenType.REFRESH, true);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/logout')
                .send({ refreshToken })
                .expect(http_status_1.default.NOT_FOUND);
        });
    });
    (0, globals_1.describe)('POST /v1/auth/refresh-tokens', () => {
        (0, globals_1.test)('should return 200 and new auth tokens if refresh token is valid', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await services_1.tokenService.saveToken(refreshToken, dbUserOne.id, expires, client_1.TokenType.REFRESH);
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(http_status_1.default.OK);
            (0, globals_1.expect)(res.body).toEqual({
                access: { token: globals_1.expect.anything(), expires: globals_1.expect.anything() },
                refresh: { token: globals_1.expect.anything(), expires: globals_1.expect.anything() }
            });
            const dbRefreshTokenData = await client_2.default.token.findFirst({
                where: { token: res.body.refresh.token },
                select: {
                    type: true,
                    userId: true,
                    blacklisted: true
                }
            });
            (0, globals_1.expect)(dbRefreshTokenData).toMatchObject({
                type: client_1.TokenType.REFRESH,
                userId: dbUserOne.id,
                blacklisted: false
            });
            const dbRefreshTokenCount = await client_2.default.token.count();
            (0, globals_1.expect)(dbRefreshTokenCount).toBe(1);
        });
        (0, globals_1.test)('should return 400 error if refresh token is missing from request body', async () => {
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/refresh-tokens').send().expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 401 error if refresh token is signed using an invalid secret', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH, 'invalidSecret');
            await services_1.tokenService.saveToken(refreshToken, dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(http_status_1.default.UNAUTHORIZED);
        });
        (0, globals_1.test)('should return 401 error if refresh token is not found in the database', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(http_status_1.default.UNAUTHORIZED);
        });
        (0, globals_1.test)('should return 401 error if refresh token is blacklisted', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.refreshExpirationDays, 'days');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await services_1.tokenService.saveToken(refreshToken, dbUserOne.id, expires, client_1.TokenType.REFRESH, true);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(http_status_1.default.UNAUTHORIZED);
        });
        (0, globals_1.test)('should return 401 error if refresh token is expired', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().subtract(1, 'minutes');
            const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await services_1.tokenService.saveToken(refreshToken, dbUserOne.id, expires, client_1.TokenType.REFRESH);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/refresh-tokens')
                .send({ refreshToken })
                .expect(http_status_1.default.UNAUTHORIZED);
        });
    });
    (0, globals_1.describe)('POST /v1/auth/forgot-password', () => {
        (0, globals_1.beforeEach)(() => {
            globals_1.jest.spyOn(services_1.emailService.transport, 'sendMail').mockClear();
        });
        (0, globals_1.test)('should return 204 and send reset password email to the user', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const sendResetPasswordEmailSpy = globals_1.jest
                .spyOn(services_1.emailService, 'sendResetPasswordEmail')
                .mockImplementationOnce(() => new Promise((resolve) => resolve()));
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/forgot-password')
                .send({ email: user_fixture_1.userOne.email })
                .expect(http_status_1.default.NO_CONTENT);
            (0, globals_1.expect)(sendResetPasswordEmailSpy).toHaveBeenCalledWith(user_fixture_1.userOne.email, globals_1.expect.any(String));
            const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
            const dbResetPasswordTokenData = await client_2.default.token.findFirst({
                where: {
                    token: resetPasswordToken,
                    userId: dbUserOne.id
                }
            });
            (0, globals_1.expect)(dbResetPasswordTokenData).toBeDefined();
        });
        (0, globals_1.test)('should return 400 if email is missing', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/forgot-password').send().expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 404 if email does not belong to any user', async () => {
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/forgot-password')
                .send({ email: user_fixture_1.userOne.email })
                .expect(http_status_1.default.NOT_FOUND);
        });
    });
    (0, globals_1.describe)('POST /v1/auth/reset-password', () => {
        (0, globals_1.test)('should return 204 and reset the password', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.resetPasswordExpirationMinutes, 'minutes');
            const resetPasswordToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await services_1.tokenService.saveToken(resetPasswordToken, dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .send({ password: 'password2' })
                .expect(http_status_1.default.NO_CONTENT);
            const dbUser = (await client_2.default.user.findUnique({ where: { id: dbUserOne.id } }));
            const isPasswordMatch = await bcryptjs_1.default.compare('password2', dbUser.password);
            (0, globals_1.expect)(isPasswordMatch).toBe(true);
            const dbResetPasswordTokenCount = await client_2.default.token.count({
                where: {
                    userId: dbUserOne.id,
                    type: client_1.TokenType.RESET_PASSWORD
                }
            });
            (0, globals_1.expect)(dbResetPasswordTokenCount).toBe(0);
        });
        (0, globals_1.test)('should return 400 if reset password token is missing', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .send({ password: 'password2' })
                .expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 401 if reset password token is blacklisted', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.resetPasswordExpirationMinutes, 'minutes');
            const resetPasswordToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await services_1.tokenService.saveToken(resetPasswordToken, dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD, true);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .send({ password: 'password2' })
                .expect(http_status_1.default.UNAUTHORIZED);
        });
        (0, globals_1.test)('should return 401 if reset password token is expired', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().subtract(1, 'minutes');
            const resetPasswordToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await services_1.tokenService.saveToken(resetPasswordToken, dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .send({ password: 'password2' })
                .expect(http_status_1.default.UNAUTHORIZED);
        });
        (0, globals_1.test)('should return 400 if password is missing or invalid', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.resetPasswordExpirationMinutes, 'minutes');
            const resetPasswordToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await services_1.tokenService.saveToken(resetPasswordToken, dbUserOne.id, expires, client_1.TokenType.RESET_PASSWORD);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .expect(http_status_1.default.BAD_REQUEST);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .send({ password: 'short1' })
                .expect(http_status_1.default.BAD_REQUEST);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .send({ password: 'password' })
                .expect(http_status_1.default.BAD_REQUEST);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/reset-password')
                .query({ token: resetPasswordToken })
                .send({ password: '11111111' })
                .expect(http_status_1.default.BAD_REQUEST);
        });
    });
    (0, globals_1.describe)('POST /v1/auth/send-verification-email', () => {
        (0, globals_1.beforeEach)(() => {
            globals_1.jest.spyOn(services_1.emailService.transport, 'sendMail').mockClear();
        });
        (0, globals_1.test)('should return 204 and send verification email to the user', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const sendVerificationEmailSpy = globals_1.jest
                .spyOn(services_1.emailService, 'sendVerificationEmail')
                .mockImplementationOnce(() => new Promise((resolve) => resolve()));
            const userOneAccessToken = services_1.tokenService.generateToken(dbUserOne.id, (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes'), client_1.TokenType.ACCESS);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/send-verification-email')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .expect(http_status_1.default.NO_CONTENT);
            (0, globals_1.expect)(sendVerificationEmailSpy).toHaveBeenCalledWith(user_fixture_1.userOne.email, globals_1.expect.any(String));
            const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];
            const dbVerifyEmailToken = await client_2.default.token.findFirst({
                where: {
                    token: verifyEmailToken,
                    userId: dbUserOne.id
                }
            });
            (0, globals_1.expect)(dbVerifyEmailToken).toBeDefined();
        });
        (0, globals_1.test)('should return 401 error if access token is missing', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/send-verification-email')
                .send()
                .expect(http_status_1.default.UNAUTHORIZED);
        });
    });
    (0, globals_1.describe)('POST /v1/auth/verify-email', () => {
        (0, globals_1.test)('should return 204 and verify the email', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.verifyEmailExpirationMinutes, 'minutes');
            const verifyEmailToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.VERIFY_EMAIL);
            await services_1.tokenService.saveToken(verifyEmailToken, dbUserOne.id, expires, client_1.TokenType.VERIFY_EMAIL);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/verify-email')
                .query({ token: verifyEmailToken })
                .send()
                .expect(http_status_1.default.NO_CONTENT);
            const dbUser = (await client_2.default.user.findUnique({ where: { id: dbUserOne.id } }));
            (0, globals_1.expect)(dbUser.isEmailVerified).toBe(true);
            const dbVerifyEmailToken = await client_2.default.token.count({
                where: {
                    userId: dbUserOne.id,
                    type: client_1.TokenType.VERIFY_EMAIL
                }
            });
            (0, globals_1.expect)(dbVerifyEmailToken).toBe(0);
        });
        (0, globals_1.test)('should return 400 if verify email token is missing', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            await (0, supertest_1.default)(app_1.default).post('/v1/auth/verify-email').send().expect(http_status_1.default.BAD_REQUEST);
        });
        (0, globals_1.test)('should return 401 if verify email token is blacklisted', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().add(config_1.default.jwt.verifyEmailExpirationMinutes, 'minutes');
            const verifyEmailToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.VERIFY_EMAIL);
            await services_1.tokenService.saveToken(verifyEmailToken, dbUserOne.id, expires, client_1.TokenType.VERIFY_EMAIL, true);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/verify-email')
                .query({ token: verifyEmailToken })
                .send()
                .expect(http_status_1.default.UNAUTHORIZED);
        });
        (0, globals_1.test)('should return 401 if verify email token is expired', async () => {
            await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
            const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
            const expires = (0, moment_1.default)().subtract(1, 'minutes');
            const verifyEmailToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.VERIFY_EMAIL);
            await services_1.tokenService.saveToken(verifyEmailToken, dbUserOne.id, expires, client_1.TokenType.VERIFY_EMAIL);
            await (0, supertest_1.default)(app_1.default)
                .post('/v1/auth/verify-email')
                .query({ token: verifyEmailToken })
                .send()
                .expect(http_status_1.default.UNAUTHORIZED);
        });
    });
});
(0, globals_1.describe)('Auth middleware', () => {
    (0, globals_1.test)('should call next with no errors if access token is valid', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
        const userOneAccessToken = services_1.tokenService.generateToken(dbUserOne.id, (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes'), client_1.TokenType.ACCESS);
        const req = node_mocks_http_1.default.createRequest({
            headers: { Authorization: `Bearer ${userOneAccessToken}` }
        });
        const next = globals_1.jest.fn();
        await new Promise((resolve) => {
            (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
            resolve();
        });
        (0, globals_1.expect)(next).toHaveBeenCalledWith();
        (0, globals_1.expect)(req.user.id).toEqual(dbUserOne.id);
    });
    (0, globals_1.test)('should call next with unauthorized error if access token is not found in header', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const req = node_mocks_http_1.default.createRequest();
        const next = globals_1.jest.fn();
        await new Promise((resolve) => {
            (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
            resolve();
        });
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: 'Please authenticate'
        }));
    });
    (0, globals_1.test)('should call next with unauthorized error if access token is not a valid jwt token', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const req = node_mocks_http_1.default.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: 'Please authenticate'
        }));
    });
    (0, globals_1.test)('should call next with unauthorized error if the token is not an access token', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
        const expires = (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes');
        const refreshToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.REFRESH);
        const req = node_mocks_http_1.default.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: 'Please authenticate'
        }));
    });
    (0, globals_1.test)('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
        const expires = (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes');
        const accessToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.ACCESS, 'invalidSecret');
        const req = node_mocks_http_1.default.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: 'Please authenticate'
        }));
    });
    (0, globals_1.test)('should call next with unauthorized error if access token is expired', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
        const expires = (0, moment_1.default)().subtract(1, 'minutes');
        const accessToken = services_1.tokenService.generateToken(dbUserOne.id, expires, client_1.TokenType.ACCESS);
        const req = node_mocks_http_1.default.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: 'Please authenticate'
        }));
    });
    (0, globals_1.test)('should call next with unauthorized error if user is not found', async () => {
        const userOneAccessToken = services_1.tokenService.generateToken(2000, (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes'), client_1.TokenType.ACCESS);
        const req = node_mocks_http_1.default.createRequest({
            headers: { Authorization: `Bearer ${userOneAccessToken}` }
        });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)()(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            statusCode: http_status_1.default.UNAUTHORIZED,
            message: 'Please authenticate'
        }));
    });
    (0, globals_1.test)('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
        const userOneAccessToken = services_1.tokenService.generateToken(dbUserOne.id, (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes'), client_1.TokenType.ACCESS);
        const req = node_mocks_http_1.default.createRequest({
            headers: { Authorization: `Bearer ${userOneAccessToken}` }
        });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)('anyRight')(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.any(ApiError_1.default));
        (0, globals_1.expect)(next).toHaveBeenCalledWith(globals_1.expect.objectContaining({ statusCode: http_status_1.default.FORBIDDEN, message: 'Forbidden' }));
    });
    (0, globals_1.test)('should call next with no errors if user does not have required rights but userId is in params', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.userOne]);
        const dbUserOne = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.userOne.email } }));
        const userOneAccessToken = services_1.tokenService.generateToken(dbUserOne.id, (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes'), client_1.TokenType.ACCESS);
        const req = node_mocks_http_1.default.createRequest({
            headers: { Authorization: `Bearer ${userOneAccessToken}` },
            params: { userId: dbUserOne.id }
        });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)('anyRight')(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith();
    });
    (0, globals_1.test)('should call next with no errors if user has required rights', async () => {
        await (0, user_fixture_1.insertUsers)([user_fixture_1.admin]);
        const dbAdmin = (await client_2.default.user.findUnique({ where: { email: user_fixture_1.admin.email } }));
        const adminAccessToken = services_1.tokenService.generateToken(dbAdmin.id, (0, moment_1.default)().add(config_1.default.jwt.accessExpirationMinutes, 'minutes'), client_1.TokenType.ACCESS);
        const req = node_mocks_http_1.default.createRequest({
            headers: { Authorization: `Bearer ${adminAccessToken}` },
            params: { userId: dbAdmin.id }
        });
        const next = globals_1.jest.fn();
        await (0, auth_1.default)(...roles_1.roleRights.get(client_1.Role.ADMIN))(req, node_mocks_http_1.default.createResponse(), next);
        (0, globals_1.expect)(next).toHaveBeenCalledWith();
    });
});
//# sourceMappingURL=auth.test.js.map