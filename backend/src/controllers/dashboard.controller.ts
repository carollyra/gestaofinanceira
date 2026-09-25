import type { Request, Response } from 'express';

import {
  categoryBreakdownQuerySchema,
  evolutionQuerySchema,
  summaryQuerySchema,
} from '../schemas/dashboard.schema';
import * as dashboardService from '../services/dashboard.service';
import { getAuthUserId } from '../utils/auth-user';

export async function summary(req: Request, res: Response) {
  const { month } = summaryQuerySchema.parse(req.query);

  res.json(await dashboardService.getSummary(getAuthUserId(req), month));
}

export async function monthlyEvolution(req: Request, res: Response) {
  const query = evolutionQuerySchema.parse(req.query);

  res.json({ data: await dashboardService.getMonthlyEvolution(getAuthUserId(req), query) });
}

export async function categoryBreakdown(req: Request, res: Response) {
  const query = categoryBreakdownQuerySchema.parse(req.query);

  res.json(await dashboardService.getCategoryBreakdown(getAuthUserId(req), query));
}
