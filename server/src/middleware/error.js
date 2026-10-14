// server/src/middleware/error.js
// Централизованная обработка ошибок.
// Ставится последним middleware в цепочке.

import { config } from '../config.js';

export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}`, err);

  // Ошибки валидации Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten?.().fieldErrors ?? err.errors,
    });
  }

  // Ошибки Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Already exists',
      field: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Общий случай
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(config.isDev && { stack: err.stack }),
  });
}

// 404-хендлер
export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found', path: req.path });
}
