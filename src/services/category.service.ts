import { PrismaClient, Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

/**
 * Create a category
 * @param {Object} categoryBody
 * @returns {Promise<Category>}
 */
const createCategory = async (categoryBody: { name: string; description?: string }) => {
  return prisma.category.create({
    data: categoryBody
  });
};

/**
 * Query for categories
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryCategories = async (
  filter: Record<string, any>,
  options: { sortBy?: string; limit?: number; page?: number }
) => {
  const { sortBy, limit = 10, page = 1 } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.CategoryWhereInput = filter.name
    ? { name: { contains: filter.name, mode: Prisma.QueryMode.insensitive } }
    : {};

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy ? { [sortBy]: 'asc' } : { createdAt: 'desc' }
    }),
    prisma.category.count({ where })
  ]);

  return {
    results: categories,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalResults: total
  };
};

/**
 * Get category by id
 * @param {ObjectId} id
 * @returns {Promise<Category>}
 */
const getCategoryById = async (id: number) => {
  const category = await prisma.category.findUnique({
    where: { id }
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  return category;
};

/**
 * Update category by id
 * @param {ObjectId} categoryId
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryById = async (
  categoryId: number,
  updateBody: { name?: string; description?: string }
) => {
  const category = await getCategoryById(categoryId);
  return prisma.category.update({
    where: { id: category.id },
    data: updateBody
  });
};

/**
 * Delete category by id
 * @param {ObjectId} categoryId
 * @returns {Promise<Category>}
 */
const deleteCategoryById = async (categoryId: number) => {
  const category = await getCategoryById(categoryId);
  return prisma.category.delete({
    where: { id: category.id }
  });
};

export default {
  createCategory,
  queryCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById
};
