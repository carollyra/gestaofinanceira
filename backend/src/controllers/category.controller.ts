import type { Request, Response } from 'express';

import {
  createCategorySchema,
  deleteCategoryQuerySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from '../schemas/category.schema';
import { idParamSchema } from '../schemas/common.schema';
import * as categoryService from '../services/category.service';
import { getAuthUserId } from '../utils/auth-user';

export async function list(req: Request, res: Response) {
  const { type } = listCategoriesQuerySchema.parse(req.query);
  const data = await categoryService.listCategories(getAuthUserId(req), type);

  res.json({ data });
}

export async function show(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  res.json(await categoryService.getCategory(getAuthUserId(req), id));
}

export async function create(req: Request, res: Response) {
  const input = createCategorySchema.parse(req.body);

  res.status(201).json(await categoryService.createCategory(getAuthUserId(req), input));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const input = updateCategorySchema.parse(req.body);

  res.json(await categoryService.updateCategory(getAuthUserId(req), id, input));
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { replaceWith } = deleteCategoryQuerySchema.parse(req.query);
  await categoryService.deleteCategory(getAuthUserId(req), id, replaceWith);

  res.status(204).end();
}
