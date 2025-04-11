import { PrismaClient, Product, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const prisma = new PrismaClient();

interface QueryOptions {
  sortBy?: string;
  limit?: number;
  page?: number;
}

interface FilterOptions {
  title?: string;
  companyId?: number;
  categoryId?: number;
}

/**
 * Create a product
 * @param {Prisma.ProductCreateInput} productBody
 * @returns {Promise<Product>}
 */
const createProduct0 = async (productBody: Prisma.ProductCreateInput): Promise<Product> => {
  return prisma.product.create({
    data: {
      ...productBody,
      ratio: 0
    },
    include: {
      category: true,
      company: true
    }
  });
};

/**
 * Query for products
 * @param {FilterOptions} filter - Mongo filter
 * @param {QueryOptions} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryProducts = async (filter: FilterOptions, options: QueryOptions) => {
  const { limit = 10, page = 1, sortBy } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    ...(filter.title && { title: { contains: filter.title } }),
    ...(filter.companyId && { companyId: filter.companyId }),
    ...(filter.categoryId && { categoryId: filter.categoryId })
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput = sortBy
    ? { [sortBy.split(':')[0]]: sortBy.split(':')[1] as Prisma.SortOrder }
    : { id: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: true,
        company: true
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    results: products,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    total
  };
};

/**
 * Get product by id
 * @param {number} id
 * @returns {Promise<Product | null>}
 */
const getProductById = async (id: number): Promise<Product | null> => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      company: true
    }
  });
};

/**
 * Update product by id
 * @param {number} productId
 * @param {Prisma.ProductUpdateInput} updateBody
 * @returns {Promise<Product>}
 */
const updateProductById = async (
  productId: number,
  updateBody: Prisma.ProductUpdateInput
): Promise<Product> => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return prisma.product.update({
    where: { id: productId },
    data: updateBody,
    include: {
      category: true,
      company: true
    }
  });
};

/**
 * Delete product by id
 * @param {number} productId
 * @returns {Promise<Product>}
 */
const deleteProductById = async (productId: number): Promise<Product> => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }
  return prisma.product.delete({
    where: { id: productId }
  });
};

export { createProduct0, queryProducts, getProductById, updateProductById, deleteProductById };
