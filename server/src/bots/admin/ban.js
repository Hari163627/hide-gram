// server/src/bots/admin/ban.js
// Бан и разбан юзеров.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { config } from '../../config.js';
import { CB, BAN_REASONS } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

export function registerBanHandlers(bot) {
  // ─── Открыть меню бана ───
  bot.callbackQuery(CB.ADMIN_BAN, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showUserPicker(ctx, 'ban');
  });

  // ─── Меню разбана ───
  bot.callbackQuery(CB.ADMIN_UNBAN, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showUserPicker(ctx, 'unban');
  });

  // ─── Выбор юзера ───
  bot.callbackQuery(/^admin:(ban|unban):user:(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const userId = ctx.match[2];
    await ctx.answerCallbackQuery();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return ctx.answerCallbackQuery({
        text: 'Юзер не найден',
        show_alert: true,
      });
    }

    if (action === 'unban') {
      // Разбан сразу
      await prisma.user.update({
        where: { id: userId },
        data: {
          banned: false,
          banReason: null,
          banUntil: null,
        },
      });

      await prisma.adminLog.create({
        data: {
          adminTgId: String(config.ADMIN_TG_ID),
          action: 'unban',
          targetId: userId,
        },
      });

      return ctx.editMessageText(
        `✅ *Разбанен*\n\n` +
        `@${user.username} (${user.displayName})\n\n` +
        `Теперь может пользоваться Hide Gram.`,
        {
          parse_mode: 'Markdown',
          reply_markup: backButton(),
        }
      );
    }

    // Бан — показываем выбор причины
    const kb = new InlineKeyboard();
    BAN_REASONS.forEach((r) => {
      kb.text(`${r.emoji} ${r.label}`, `admin:ban:reason:${userId}:${r.id}`).row();
    });
    kb.text('◀️ Назад', CB.ADMIN_BAN);

    await ctx.editMessageText(
      `🚫 *Бан юзера*\n\n` +
      `@${user.username} (${user.displayName})\n` +
      `📞 ${user.phone}\n\n` +
      `Выбери причину:`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Подтверждение бана с причиной ───
  bot.callbackQuery(/^admin:ban:reason:(.+):(.+)$/, async (ctx) => {
    const userId = ctx.match[1];
    const reasonId = ctx.match[2];
    const reason = BAN_REASONS.find((r) => r.id === reasonId);

    await ctx.answerCallbackQuery();

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason?.label || 'Не указана',
      },
    });

    await prisma.adminLog.create({
      data: {
        adminTgId: String(config.ADMIN_TG_ID),
        action: 'ban',
        targetId: userId,
        payload: { reason: reasonId },
      },
    });

    await ctx.editMessageText(
      `🚫 *Забанен*\n\n` +
      `@${user.username} (${user.displayName})\n` +
      `Причина: ${reason?.emoji} ${reason?.label}\n\n` +
      `Больше не может войти в веб-версию.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });
}

// ─── Показать список юзеров для выбора ───
async function showUserPicker(ctx, action) {
  const users = await prisma.user.findMany({
    where: action === 'unban' ? { banned: true } : { banned: false },
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      displayName: true,
      phone: true,
      banned: true,
    },
  });

  if (users.length === 0) {
    return ctx.editMessageText(
      action === 'unban'
        ? '🔓 Забаненных юзеров нет.'
        : '👥 Юзеров нет.',
      { reply_markup: backButton() }
    );
  }

  const kb = new InlineKeyboard();
  users.forEach((u) => {
    const prefix = u.banned ? '🚫' : '✅';
    kb.text(
      `${prefix} @${u.username}`,
      `admin:${action}:user:${u.id}`
    ).row();
  });
  kb.text('◀️ Назад', CB.MENU_HOME);

  await ctx.editMessageText(
    action === 'unban'
      ? '🔓 *Выбери юзера для разбана:*'
      : '🚫 *Выбери юзера для бана:*',
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}
