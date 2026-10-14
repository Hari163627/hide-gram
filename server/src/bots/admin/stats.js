// server/src/bots/admin/stats.js
// Статистика Hide Gram.

import { prisma } from '../../prisma.js';
import { CB } from '../../../../shared/constants.js';
import { getOnlineUsers } from '../../socket.js';
import { backButton } from './menu.js';

export function registerStatsHandlers(bot) {
  bot.callbackQuery(CB.ADMIN_STATS, async (ctx) => {
    await ctx.answerCallbackQuery();

    const [
      totalUsers,
      verifiedUsers,
      bannedUsers,
      totalChats,
      totalMessages,
      totalGifts,
      totalStars,
      todayUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.gift.count(),
      prisma.user.aggregate({ _sum: { stars: true } }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const onlineCount = getOnlineUsers().length;

    const text =
      `📊 *Статистика Hide Gram*\n\n` +
      `👥 Юзеров: *${totalUsers}*\n` +
      `   • онлайн: ${onlineCount}\n` +
      `   • верифицировано: ${verifiedUsers}\n` +
      `   • забанено: ${bannedUsers}\n` +
      `   • новых за 24ч: ${todayUsers}\n\n` +
      `💬 Чатов: *${totalChats}*\n` +
      `✉️ Сообщений: *${totalMessages}*\n\n` +
      `🎁 Подарков выдано: *${totalGifts}*\n` +
      `⭐ Звёзд в обороте: *${totalStars._sum.stars || 0}*\n\n` +
      `🕐 ${new Date().toLocaleString('ru-RU')}`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: backButton(),
    });
  });
}
