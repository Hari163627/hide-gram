// server/src/routes/auth.js
// Регистрация и вход:
//   1. Юзер вводит номер на сайте → POST /auth/request-code
//   2. Мы находим номер, генерируем код, шлём через User-бота
//   3. Юзер вводит код → POST /auth/verify-code
//   4. Если код верный — создаём юзера (если новый) и выдаём cookie-сессию.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { signSession } from '../utils/jwt.js';
import { generateAuthCode, generateUsername } from '../utils/random.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AUTH } from '../../../shared/constants.js';
import { sendMessageToUser } from '../bots/user/index.js';

export const authRouter = Router();

// ─── Схемы валидации ───
const requestCodeSchema = z.object({
  phone: z.string().min(5).max(30),
});

const verifyCodeSchema = z.object({
  phone: z.string().min(5).max(30),
  code: z.string().length(6),
});

// ═══════════════════════════════════════════
// POST /auth/request-code
// ═══════════════════════════════════════════
authRouter.post(
  '/request-code',
  asyncHandler(async (req, res) => {
    const { phone } = requestCodeSchema.parse(req.body);

    // 1. Проверяем, что номер выдан (существует в issued_phones)
    const issued = await prisma.issuedPhone.findUnique({
      where: { phone },
    });

    if (!issued) {
      return res.status(404).json({
        error: 'Phone not issued',
        message: 'Этот номер не выдан. Получи его в @HideGramBot.',
      });
    }

    // 2. Проверяем, что не истёк
    if (issued.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Phone expired',
        message: 'Срок действия номера истёк. Получи новый в боте.',
      });
    }

    // 3. Проверяем, что у номера есть привязка к TG ID
    if (!issued.issuedTo) {
      return res.status(400).json({
        error: 'No telegram binding',
        message: 'Номер не привязан к Telegram. Получи новый в боте.',
      });
    }

    // 4. Удаляем старые коды для этого номера
    await prisma.authCode.deleteMany({ where: { phone } });

    // 5. Генерируем новый код
    const code = generateAuthCode();
    const expiresAt = new Date(
      Date.now() + AUTH.CODE_TTL_MINUTES * 60 * 1000
    );

    await prisma.authCode.create({
      data: {
        phone,
        tgId: issued.issuedTo,
        code,
        expiresAt,
      },
    });

    // 6. Отправляем код через User-бота
    try {
      await sendMessageToUser(
        issued.issuedTo,
        `🔐 *Код входа в Hide Gram*\n\n` +
          `Твой код: \`${code}\`\n\n` +
          `Действует ${AUTH.CODE_TTL_MINUTES} минут.\n` +
          `Никому не сообщай его.`
      );
    } catch (err) {
      console.error('Не удалось отправить код в Telegram:', err);
      return res.status(500).json({
        error: 'Telegram send failed',
        message: 'Не удалось отправить код. Попробуй ещё раз.',
      });
    }

    res.json({
      ok: true,
      message: 'Код отправлен в Telegram',
      ttlMinutes: AUTH.CODE_TTL_MINUTES,
    });
  })
);

// ═══════════════════════════════════════════
// POST /auth/verify-code
// ═══════════════════════════════════════════
authRouter.post(
  '/verify-code',
  asyncHandler(async (req, res) => {
    const { phone, code } = verifyCodeSchema.parse(req.body);

    // 1. Находим активный код
    const authCode = await prisma.authCode.findFirst({
      where: {
        phone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!authCode) {
      return res.status(400).json({
        error: 'No active code',
        message: 'Код не найден или истёк. Запроси новый.',
      });
    }

    // 2. Проверяем количество попыток
    if (authCode.attempts >= AUTH.CODE_MAX_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Слишком много попыток. Запроси новый код.',
      });
    }

    // 3. Проверяем сам код
    if (authCode.code !== code) {
      await prisma.authCode.update({
        where: { id: authCode.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({
        error: 'Invalid code',
        message: 'Неверный код',
        attemptsLeft: AUTH.CODE_MAX_ATTEMPTS - authCode.attempts - 1,
      });
    }

    // 4. Код верный — помечаем использованным
    await prisma.authCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    // 5. Ищем юзера по номеру
    let user = await prisma.user.findUnique({ where: { phone } });

    // 6. Если юзера нет — создаём (регистрация)
    if (!user) {
      // Генерируем username из номера
      const displayName = `User ${phone.slice(-4)}`;
      const username = generateUsername(displayName);

      user = await prisma.user.create({
        data: {
          phone,
          username,
          displayName,
          tgId: authCode.tgId,
        },
      });

      // Помечаем номер как использованный
      await prisma.issuedPhone.update({
        where: { phone },
        data: {
          used: true,
          usedAt: new Date(),
          usedByUserId: user.id,
        },
      });

      // Системное сообщение от Hide Gram Team
      await createWelcomeChat(user.id);
    } else {
      // Существующий юзер — обновим tgId, если изменился
      if (user.tgId !== authCode.tgId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { tgId: authCode.tgId },
        });
      }
    }

    // 7. Создаём сессию
    const token = signSession({ userId: user.id });
    const expiresAt = new Date(
      Date.now() + AUTH.SESSION_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip,
        expiresAt,
      },
    });

    // 8. Ставим httpOnly cookie
    res.cookie('hg_session', token, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: AUTH.SESSION_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        phone: user.phone,
        verified: user.verified,
        stars: user.stars,
      },
    });
  })
);

// ═══════════════════════════════════════════
// POST /auth/logout
// ═══════════════════════════════════════════
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.hg_session;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    res.clearCookie('hg_session', { path: '/' });
    res.json({ ok: true });
  })
);

// ═══════════════════════════════════════════
// GET /auth/me — текущий юзер
// ═══════════════════════════════════════════
authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.hg_session;
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const { verifySession } = await import('../utils/jwt.js');
    const payload = verifySession(token);
    if (!payload) {
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
        stars: true,
        language: true,
        theme: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  })
);

// ═══════════════════════════════════════════
// Хелпер: создать приветственный чат
// ═══════════════════════════════════════════
async function createWelcomeChat(userId) {
  // Системный чат "Hide Gram Team"
  const teamUser = await prisma.user.upsert({
    where: { username: 'hidegram_team' },
    update: {},
    create: {
      phone: '+000 000 000',
      username: 'hidegram_team',
      displayName: 'Hide Gram Team',
      verified: true,
      bio: 'Официальный аккаунт Hide Gram',
    },
  });

  const chat = await prisma.chat.create({
    data: {
      type: 'private',
      members: {
        create: [
          { userId, role: 'member' },
          { userId: teamUser.id, role: 'member' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: teamUser.id,
      type: 'system',
      text:
        `👋 Добро пожаловать в *Hide Gram*!\n\n` +
        `Это твой первый чат — от нашей команды.\n\n` +
        `Чтобы начать общаться:\n` +
        `• Нажми 🔍 и введи *@username* другого юзера\n` +
        `• Загляни в настройки ⚙️ и настрой профиль\n` +
        `• Открой 🎁 магазин подарков — есть что-то для тебя`,
    },
  });

  await prisma.chat.update({
    where: { id: chat.id },
    data: { lastMessageAt: new Date() },
  });

  return chat;
}
