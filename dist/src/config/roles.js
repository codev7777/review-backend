"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRights = exports.roles = void 0;
const client_1 = require("@prisma/client");
const allRoles = {
    [client_1.Role.USER]: ['getCompanies', 'manageCompanies', 'getCategories'],
    [client_1.Role.ADMIN]: [
        'getCompanies',
        'manageCompanies',
        'getUsers',
        'manageUsers',
        'getCategories',
        'manageCategories'
    ]
};
exports.roles = Object.keys(allRoles);
exports.roleRights = new Map(Object.entries(allRoles));
//# sourceMappingURL=roles.js.map