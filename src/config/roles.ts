import { Role } from '@prisma/client';

const allRoles = {
  [Role.USER]: ['getCompanies', 'manageCompanies', 'getCategories', 'manageCompanyUsers'],
  [Role.ADMIN]: [
    'getCompanies',
    'manageCompanies',
    'getUsers',
    'manageUsers',
    'getCategories',
    'manageCategories',
    'manageCompanyUsers'
  ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
