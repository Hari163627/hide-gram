// server/src/bots/user/profile.js
// Профиль юзера в боте.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { CB } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

export function registerProfileHandlers(bot) {
  bot.callbackQuery(CB.USER_PROFILE, async (ctx) => {
    await ctx.answerCallbackQuery();

    const tgId = String(ctx.from.id);
    const user = await prisma.user.findUnique({
      where: { tgId },
      include: {
        _count: {
          select: { gifts: true },
        },
      },
    });

    if (!user) {
      const kb = new InlineKeyboard()
        .text('📱 Получить номер', CB.USER_GET_PHONE).row()
        .text('◀️ Назад', CB.MENU_HOME);

      return ctx.editMessageText(
        '👤 *Профиль*\n\n' +
        'Ты ещё не зарегистрирован в Hide Gram.\n\n' +
        'Получи номер и зарегистрируйся через веб-версию.',
        {
          parse_mode: 'Markdown',
          reply_markup: kb,
        }
      );
    }

    const kb = new InlineKeyboard()
      .url(
        '🌐 Открыть веб-профиль',
        `https://hide-gram-web.onrender.com/@${user.username}`
      ).row()
      .text('◀️ Назад', CB.MENU_HOME);

    const verifiedBadge = user.verified ? ' ⭐' : '';
    const premiumBadge = user.premiumUntil && user.premiumUntil > new Date()
      ? ' 💎 Premium'
      : '';

    await ctx.editMessageText(
      `👤 *Профиль*\n\n` +
      `*${user.displayName}*${verifiedBadge}${premiumBadge}\n` +
      `@${user.username}\n` +
      `📞 ${user.phone}\n\n` +
      `💬 Юзернейм: @${user.username}\n` +
      `📅 Зарегистрирован: ${user.createdAt.toLocaleDateString('ru-RU')}\n\n` +
      `⭐ Звёзд: *${user.stars}*\n` +
      `🎁 Подарков: *${user._count.gifts}*\n` +
      `📊 Чатов: (считаем в вебе)`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });
}
