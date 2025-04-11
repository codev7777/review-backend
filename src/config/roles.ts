import { Role } from '@prisma/client';

const allRoles = {
  [Role.USER]: ['getCompanies', 'manageCompanies', 'getCategories'],
  [Role.ADMIN]: [
    'getCompanies',
    'manageCompanies',
    'getUsers',
    'manageUsers',
    'getCategories',
    'manageCategories'
  ]
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
