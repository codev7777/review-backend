import { Role } from '@prisma/client';

const allRoles = {
  [Role.USER]: ['getCompanies', 'manageCompanies'],
  [Role.ADMIN]: ['getCompanies', 'manageCompanies', 'getUsers', 'manageUsers']
};

export const roles = Object.keys(allRoles);
export const roleRights = new Map(Object.entries(allRoles));
