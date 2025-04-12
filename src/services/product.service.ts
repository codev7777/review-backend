import { PrismaClient, Product, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import { saveProductImage, deleteImage } from '../utils/fileUpload';

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
  asin?: string;
}

/**
 * Create a product
 * @param {any} productBody
 * @returns {Promise<Product>}
 */
const createProduct0 = async (productBody: any): Promise<Product> => {
  // Check if ASIN is provided and validate its format
  if (productBody.asin) {
    const asinRegex = /^[A-Z0-9]{10}$/;
    if (!asinRegex.test(productBody.asin)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid ASIN format');
    }

    // Check if ASIN already exists using raw query to avoid type issues
    const existingProducts = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Product" WHERE asin = ${productBody.asin}
    `;

    if (existingProducts.length > 0) {
      throw new ApiError(httpStatus.CONFLICT, 'Product with this ASIN already exists');
    }
  }

  // Handle image upload
  let imageUrl = productBody.image;
  if (productBody.image && productBody.image.startsWith('data:image')) {
    imageUrl = saveProductImage(productBody.image);
  }

  return prisma.product.create({
    data: {
      ...productBody,
      image: imageUrl,
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

  // If ASIN is provided, get the product IDs first using raw SQL
  if (filter.asin) {
    const asinProducts = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "Product" WHERE asin = ${filter.asin}
    `;
    const productIds = asinProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return {
        results: [],
        page,
        limit,
        totalPages: 0,
        total: 0
      };
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        category: true,
        company: true
      }
    });

    return {
      results: products,
      page,
      limit,
      totalPages: 1,
      total: products.length
    };
  }

  // For non-ASIN searches, use the standard query builder
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
 * @param {any} updateBody
 * @returns {Promise<Product>}
 */
const updateProductById = async (productId: number, updateBody: any): Promise<Product> => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Handle image upload if a new image is provided
  let imageUrl = updateBody.image;
  if (updateBody.image && updateBody.image.startsWith('data:image')) {
    // Delete the old image if it exists
    if (product.image) {
      deleteImage(product.image);
    }
    imageUrl = saveProductImage(updateBody.image);
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...updateBody,
      image: imageUrl
    },
    include: {
      category: true,
      company: true
    }
  });
};

/**
 * Delete product by id
 * @param {number} productId
 * @returns {Promise<void>}
 */
const deleteProductById = async (productId: number): Promise<void> => {
  const product = await getProductById(productId);
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  // Delete the product image if it exists
  if (product.image) {
    deleteImage(product.image);
  }

  await prisma.product.delete({
    where: { id: productId }
  });
};

export { createProduct0, queryProducts, getProductById, updateProductById, deleteProductById };
