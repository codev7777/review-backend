"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtStrategy = void 0;
const client_1 = __importDefault(require("../client"));
const passport_jwt_1 = require("passport-jwt");
const config_1 = __importDefault(require("./config"));
const client_2 = require("@prisma/client");
const jwtOptions = {
    secretOrKey: config_1.default.jwt.secret,
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()
};
const jwtVerify = async (payload, done) => {
    try {
        if (payload.type !== client_2.TokenType.ACCESS) {
            throw new Error('Invalid token type');
        }
        const user = await client_1.default.user.findUnique({
            select: {
                id: true,
                email: true,
                name: true
            },
            where: { id: payload.sub }
        });
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    }
    catch (error) {
        done(error, false);
    }
};
exports.jwtStrategy = new passport_jwt_1.Strategy(jwtOptions, jwtVerify);
//# sourceMappingURL=passport.js.map