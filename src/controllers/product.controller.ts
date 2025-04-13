import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import {
  createProduct0,
  queryProducts,
  getProductById,
  updateProductById,
  deleteProductById
} from '../services/product.service';
import pick from '../utils/pick';
import multer from 'multer';
import { saveProductImage } from '../utils/fileUpload';

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Extend the Express Request type to include the file property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

interface FilterOptions {
  title?: string;
  companyId?: number;
  categoryId?: number;
  asin?: string;
  ids?: string;
}

interface QueryOptions {
  page: number;
  limit: number;
  sortBy?: string;
}

const createProduct = catchAsync(async (req: Request, res: Response) => {
  // Process the request body
  const productData = { ...req.body };

  // Convert string IDs to numbers
  if (productData.companyId) {
    productData.companyId = Number(productData.companyId);
  }
  if (productData.categoryId) {
    productData.categoryId = Number(productData.categoryId);
  }

  // Handle image file if it exists
  if (req.file) {
    // Convert the buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    productData.image = base64Image;
  }

  const product = await createProduct0(productData);
  res.status(httpStatus.CREATED).send(product);
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { title, companyId, categoryId, asin, ids } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = req.query.sortBy as string;

    const filter: FilterOptions = {
      ...(title && { title: title as string }),
      ...(companyId && { companyId: parseInt(companyId as string) }),
      ...(categoryId && { categoryId: parseInt(categoryId as string) }),
      ...(asin && { asin: asin as string }),
      ...(ids && { ids: ids as string })
    };

    const options: QueryOptions = {
      page,
      limit,
      ...(sortBy && { sortBy })
    };

    const result = await queryProducts(filter, options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await getProductById(Number(req.params.productId));
  res.send(product);
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  // Process the request body
  const productData = { ...req.body };

  // Convert string IDs to numbers if they exist
  if (productData.companyId) {
    productData.companyId = Number(productData.companyId);
  }
  if (productData.categoryId) {
    productData.categoryId = Number(productData.categoryId);
  }

  // Handle image file if it exists
  if (req.file) {
    // Convert the buffer to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    productData.image = base64Image;
  }

  const product = await updateProductById(Number(req.params.productId), productData);
  res.send(product);
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  await deleteProductById(Number(req.params.productId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};
