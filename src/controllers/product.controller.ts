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

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await createProduct0(req.body);
  res.status(httpStatus.CREATED).send(product);
});

const getProducts = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, [
    'name',
    'companyId',
    'category',
    'minPrice',
    'maxPrice',
    'isActive'
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryProducts(filter, options);
  res.send(result);
});

const getProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await getProductById(Number(req.params.productId));
  res.send(product);
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await updateProductById(Number(req.params.productId), req.body);
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
