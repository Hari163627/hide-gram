// server/src/routes/health.js
// Health-check endpoint. Render пингует его каждые несколько минут.

import { Router } from 'express';
import { prisma } from '../prisma.js';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  try {
    // Проверяем, что БД доступна
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({ status: 'db_error' });
  }
});
