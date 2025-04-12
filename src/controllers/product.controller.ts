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

const getProducts = catchAsync(async (req: Request, res: Response) => {
  // Get filter options from query parameters
  const filter = pick(req.query, [
    'title',
    'companyId',
    'categoryId',
    'minPrice',
    'maxPrice',
    'isActive'
  ]);

  // Get pagination and sorting options
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // If companyId is provided as a string, convert it to a number
  if (filter.companyId && typeof filter.companyId === 'string') {
    filter.companyId = parseInt(filter.companyId, 10);
  }

  // If categoryId is provided as a string, convert it to a number
  if (filter.categoryId && typeof filter.categoryId === 'string') {
    filter.categoryId = parseInt(filter.categoryId, 10);
  }

  console.log('Product filter:', filter);
  console.log('Product options:', options);

  const result = await queryProducts(filter, options);
  res.send(result);
});

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
