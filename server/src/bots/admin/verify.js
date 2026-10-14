// server/src/bots/admin/verify.js
// Выдача и снятие галочки верификации.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { config } from '../../config.js';
import { CB } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

export function registerVerifyHandlers(bot) {
  // ─── Меню выдачи галочки ───
  bot.callbackQuery(CB.ADMIN_VERIFY, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showVerifyPicker(ctx, 'verify');
  });

  // ─── Меню снятия галочки ───
  bot.callbackQuery(CB.ADMIN_UNVERIFY, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showVerifyPicker(ctx, 'unverify');
  });

  // ─── Действие ───
  bot.callbackQuery(/^admin:(verify|unverify):user:(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const userId = ctx.match[2];
    const verify = action === 'verify';

    await ctx.answerCallbackQuery();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { verified: verify },
    });

    await prisma.adminLog.create({
      data: {
        adminTgId: String(config.ADMIN_TG_ID),
        action,
        targetId: userId,
      },
    });

    await ctx.editMessageText(
      verify
        ? `⭐ *Галочка выдана*\n\n@${user.username} теперь верифицирован.`
        : `⚪ *Галочка снята*\n\n@${user.username} больше не верифицирован.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });
}

async function showVerifyPicker(ctx, action) {
  const verify = action === 'verify';

  const users = await prisma.user.findMany({
    where: verify ? { verified: false } : { verified: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, displayName: true, verified: true },
  });

  if (users.length === 0) {
    return ctx.editMessageText(
      verify ? 'Все юзеры уже верифицированы.' : 'Верифицированных нет.',
      { reply_markup: backButton() }
    );
  }

  const kb = new InlineKeyboard();
  users.forEach((u) => {
    kb.text(`@${u.username}`, `admin:${action}:user:${u.id}`).row();
  });
  kb.text('◀️ Назад', CB.MENU_HOME);

  await ctx.editMessageText(
    verify ? '⭐ *Кому выдать галочку?*' : '⚪ *У кого снять галочку?*',
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}
