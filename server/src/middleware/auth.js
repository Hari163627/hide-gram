// server/src/middleware/auth.js
// Проверка сессии — читаем cookie, проверяем JWT, прикрепляем юзера к req.

import { prisma } from '../prisma.js';
import { verifySession } from '../utils/jwt.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.hg_session;
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const payload = verifySession(token);
    if (!payload?.userId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        phone: true,
        avatarUrl: true,
        verified: true,
        banned: true,
        banReason: true,
        stars: true,
        language: true,
        theme: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.banned) {
      return res.status(403).json({
        error: 'Banned',
        reason: user.banReason,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Опциональная проверка — если сессия есть, прикрепим юзера.
// Если нет — пропустим. Используется для публичных ручек.
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.hg_session;
    if (!token) return next();

    const payload = verifySession(token);
    if (!payload?.userId) return next();

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (user && !user.banned) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}
