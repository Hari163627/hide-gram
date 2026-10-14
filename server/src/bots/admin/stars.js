// server/src/bots/admin/stars.js
// Выдача звёзд Hide Gram юзерам.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { config } from '../../config.js';
import { CB } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

export function registerStarsHandlers(bot) {
  // ─── Открыть меню ───
  bot.callbackQuery(CB.ADMIN_GRANT_STARS, async (ctx) => {
    await ctx.answerCallbackQuery();

    const users = await prisma.user.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, stars: true },
    });

    if (users.length === 0) {
      return ctx.editMessageText('Юзеров нет.', { reply_markup: backButton() });
    }

    const kb = new InlineKeyboard();
    users.forEach((u) => {
      kb.text(
        `@${u.username} (${u.stars}⭐)`,
        `admin:stars:user:${u.id}`
      ).row();
    });
    kb.text('◀️ Назад', CB.MENU_HOME);

    await ctx.editMessageText(
      '💰 *Выдача звёзд*\n\nВыбери юзера:',
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Выбор юзера → показать суммы ───
  bot.callbackQuery(/^admin:stars:user:(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return ctx.answerCallbackQuery({ text: 'Юзер не найден', show_alert: true });
    }

    const kb = new InlineKeyboard()
      .text('+100⭐', `admin:stars:add:${userId}:100`)
      .text('+500⭐', `admin:stars:add:${userId}:500`).row()
      .text('+1000⭐', `admin:stars:add:${userId}:1000`)
      .text('+5000⭐', `admin:stars:add:${userId}:5000`).row()
      .text('−100⭐', `admin:stars:add:${userId}:-100`)
      .text('−500⭐', `admin:stars:add:${userId}:-500`).row()
      .text('◀️ Назад', CB.ADMIN_GRANT_STARS);

    await ctx.editMessageText(
      `💰 *Выдать звёзды*\n\n` +
      `@${user.username}\n` +
      `Текущий баланс: ${user.stars}⭐\n\n` +
      `Выбери сумму:`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Начислить ───
  bot.callbackQuery(/^admin:stars:add:(.+):(-?\d+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const amount = Number(ctx.match[2]);
    await ctx.answerCallbackQuery();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { stars: { increment: amount } },
    });

    await prisma.starTransaction.create({
      data: {
        userId,
        amount,
        type: 'admin_bonus',
        description: amount > 0 ? 'Выдано админом' : 'Списано админом',
        paymentMethod: 'admin',
      },
    });

    await prisma.adminLog.create({
      data: {
        adminTgId: String(config.ADMIN_TG_ID),
        action: 'grant_stars',
        targetId: userId,
        payload: { amount, newBalance: user.stars },
      },
    });

    await ctx.editMessageText(
      `✅ *Готово*\n\n` +
      `@${user.username}\n` +
      `${amount > 0 ? '+' : ''}${amount}⭐\n` +
      `Новый баланс: ${user.stars}⭐`,
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });
}
