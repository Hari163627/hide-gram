// server/src/bots/admin/logs.js
// Логи действий админа.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { CB } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

export function registerLogsHandlers(bot) {
  bot.callbackQuery(CB.ADMIN_LOGS, async (ctx) => {
    await ctx.answerCallbackQuery();

    const logs = await prisma.adminLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    if (logs.length === 0) {
      return ctx.editMessageText('📋 Логов нет.', { reply_markup: backButton() });
    }

    const actionEmoji = {
      ban: '🚫',
      unban: '✅',
      verify: '⭐',
      unverify: '⚪',
      issue_phone: '📱',
      grant_gift: '🎁',
      grant_stars: '💰',
    };

    const lines = logs.map((log) => {
      const emoji = actionEmoji[log.action] || '📌';
      const date = log.createdAt.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      let detail = log.action;
      if (log.payload) {
        const p = log.payload;
        if (log.action === 'grant_stars') detail += ` (${p.amount}⭐)`;
        if (log.action === 'grant_gift') detail += ` (${p.typeId})`;
        if (log.action === 'ban') detail += ` (${p.reason})`;
      }

      return `${emoji} \`${date}\` ${detail}`;
    }).join('\n');

    await ctx.editMessageText(
      `📋 *Последние 20 действий:*\n\n${lines}`,
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });
}
