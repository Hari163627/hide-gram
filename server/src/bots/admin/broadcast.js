// server/src/bots/admin/broadcast.js
// Рассылка сообщений от имени Hide Gram Team.

import { prisma } from '../../prisma.js';
import { CB } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

// Храним состояние — ждём ли текст от админа
const awaitingBroadcast = new Set();

export function registerBroadcastHandlers(bot) {
  bot.callbackQuery(CB.ADMIN_BROADCAST, async (ctx) => {
    await ctx.answerCallbackQuery();
    awaitingBroadcast.add(String(ctx.from.id));

    await ctx.editMessageText(
      '📢 *Рассылка*\n\n' +
      'Отправь текст сообщения (Markdown разрешён).\n' +
      'Оно придёт всем юзерам от имени *Hide Gram Team*.\n\n' +
      'Отправь /cancel для отмены.',
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });

  // ─── Получаем текст ───
  bot.on('message:text', async (ctx, next) => {
    const adminId = String(ctx.from.id);
    if (!awaitingBroadcast.has(adminId)) return next();

    if (ctx.message.text === '/cancel') {
      awaitingBroadcast.delete(adminId);
      return ctx.reply('❌ Рассылка отменена.');
    }

    awaitingBroadcast.delete(adminId);

    const text = ctx.message.text;
    await ctx.reply('⏳ Начинаю рассылку...');

    // Находим командный аккаунт
    const teamUser = await prisma.user.findUnique({
      where: { username: 'hidegram_team' },
    });

    if (!teamUser) {
      return ctx.reply('❌ Командный аккаунт не найден.');
    }

    // Находим все приватные чаты с командой
    const chats = await prisma.chat.findMany({
      where: {
        type: 'private',
        members: {
          some: { userId: teamUser.id },
        },
      },
      include: {
        members: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const chat of chats) {
      try {
        await prisma.message.create({
          data: {
            chatId: chat.id,
            senderId: teamUser.id,
            type: 'system',
            text,
          },
        });
        await prisma.chat.update({
          where: { id: chat.id },
          data: { lastMessageAt: new Date() },
        });
        sent++;
      } catch {
        failed++;
      }
    }

    await ctx.reply(
      `✅ *Рассылка завершена*\n\n` +
      `📤 Доставлено: ${sent}\n` +
      `❌ Ошибок: ${failed}`,
      { parse_mode: 'Markdown' }
    );
  });
}
