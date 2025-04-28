import { Request, Response } from 'express';
import prisma from '../client';
import { z } from 'zod';

const createDiscountCodeSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discount: z.number().min(0),
  validFrom: z.string().transform((str: string) => new Date(str)),
  validUntil: z.string().transform((str: string) => new Date(str)).optional(),
  type: z.string().default('PERCENTAGE'),
  status: z.string().default('ACTIVE'),
  isActive: z.boolean().default(true)
});

const updateDiscountCodeSchema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  discount: z.number().min(0).optional(),
  validFrom: z.string().transform((str: string) => new Date(str)).optional(),
  validUntil: z.string().transform((str: string) => new Date(str)).optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional()
});

export const createDiscountCode = async (req: Request, res: Response) => {
  try {
    const validatedData = createDiscountCodeSchema.parse(req.body);
    const discountCode = await prisma.discountCode.create({
      data: validatedData
    });
    res.status(201).json(discountCode);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error creating discount code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getDiscountCodes = async (req: Request, res: Response) => {
  try {
    const discountCodes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(discountCodes);
  } catch (error) {
    console.error('Error getting discount codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDiscountCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const discountCode = await prisma.discountCode.findUnique({
      where: { id: parseInt(id) },
    });
    if (!discountCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }
    res.json(discountCode);
  } catch (error) {
    console.error('Error getting discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDiscountCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateDiscountCodeSchema.parse(req.body);
    const discountCode = await prisma.discountCode.update({
      where: { id: parseInt(id) },
      data: validatedData
    });
    res.json(discountCode);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      console.error('Error updating discount code:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const deleteDiscountCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.discountCode.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting discount code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 