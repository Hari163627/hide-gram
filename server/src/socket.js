// server/src/socket.js
// Socket.IO для realtime: сообщения, статусы, typing.

import { prisma } from './prisma.js';
import { verifySession } from './utils/jwt.js';

// Храним активные подключения: userId → Set<socketId>
const onlineUsers = new Map();

export function setupSocket(io) {
  // ─── Middleware аутентификации ───
  io.use(async (socket, next) => {
    try {
      // Читаем cookie из handshake headers
      const rawCookie = socket.handshake.headers.cookie || '';
      const cookies = Object.fromEntries(
        rawCookie.split('; ').map((c) => c.split('='))
      );
      const token = cookies['hg_session'];

      if (!token) return next(new Error('No session'));

      const payload = verifySession(token);
      if (!payload?.userId) return next(new Error('Invalid session'));

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          banned: true,
        },
      });

      if (!user) return next(new Error('User not found'));
      if (user.banned) return next(new Error('Banned'));

      socket.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  // ─── Подключение ───
  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 Socket connected: ${socket.user.username}`);

    // Регистрируем юзера как онлайн
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Обновляем статус в БД
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    }).catch(() => {});

    // Оповещаем всех — этот юзер онлайн
    socket.broadcast.emit('user:online', { userId });

    // ─── Присоединиться к комнате чата ───
    socket.on('chat:join', async ({ chatId }) => {
      // Проверяем, что юзер в чате
      const member = await prisma.chatMember.findUnique({
        where: {
          chatId_userId: { chatId, userId },
        },
      });
      if (member) {
        socket.join(`chat:${chatId}`);
      }
    });

    // ─── Покинуть комнату чата ───
    socket.on('chat:leave', ({ chatId }) => {
      socket.leave(`chat:${chatId}`);
    });

    // ─── Новое сообщение ───
    socket.on('message:send', async ({ chatId, text }, callback) => {
      try {
        const trimmed = String(text || '').trim();
        if (!trimmed || trimmed.length > 4000) {
          return callback?.({ error: 'Invalid message' });
        }

        // Проверяем, что юзер в чате
        const member = await prisma.chatMember.findUnique({
          where: { chatId_userId: { chatId, userId } },
        });
        if (!member) {
          return callback?.({ error: 'Not a member' });
        }

        // Создаём сообщение
        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            type: 'text',
            text: trimmed,
            deliveredAt: new Date(),
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                verified: true,
              },
            },
          },
        });

        // Обновляем последнее сообщение в чате
        await prisma.chat.update({
          where: { id: chatId },
          data: {
            lastMessageId: message.id,
            lastMessageAt: new Date(),
          },
        });

        // Рассылаем всем в комнате
        io.to(`chat:${chatId}`).emit('message:new', message);

        // Acknowledge отправителю
        callback?.({ ok: true, message });

        // ─── Уведомления участникам, кто НЕ в комнате ───
        const members = await prisma.chatMember.findMany({
          where: { chatId, userId: { not: userId } },
          select: { userId: true },
        });

        for (const m of members) {
          const userSockets = onlineUsers.get(m.userId);
          if (userSockets) {
            for (const sid of userSockets) {
              io.to(sid).emit('chat:notify', {
                chatId,
                message,
              });
            }
          }
        }
      } catch (err) {
        console.error('message:send error:', err);
        callback?.({ error: 'Server error' });
      }
    });

    // ─── Отметить прочитанным ───
    socket.on('message:read', async ({ chatId, lastMessageId }) => {
      await prisma.chatMember.update({
        where: { chatId_userId: { chatId, userId } },
        data: { lastReadAt: new Date() },
      }).catch(() => {});

      // Оповещаем отправителя
      socket.to(`chat:${chatId}`).emit('message:read', {
        chatId,
        userId,
        lastMessageId,
      });
    });

    // ─── Печатает ───
    socket.on('typing:start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:start', {
        chatId,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:stop', {
        chatId,
        userId,
      });
    });

    // ─── Отключение ───
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username}`);

      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);

          // Обновляем статус в БД
          await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen: new Date() },
          }).catch(() => {});

          // Оповещаем всех
          io.emit('user:offline', {
            userId,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    });
  });
}

// ─── Экспорт для использования в других местах ───
export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

export function isOnline(userId) {
  return onlineUsers.has(userId);
}
