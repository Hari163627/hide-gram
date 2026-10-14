// server/src/bots/admin/issue.js
// Выдача номеров для регистрации в веб-версии Hide Gram.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { config } from '../../config.js';
import { CB, PHONE_PREFIXES, AUTH } from '../../../../shared/constants.js';
import { generatePhone } from '../../utils/random.js';
import { backButton } from './menu.js';

export function registerIssueHandlers(bot) {
  // ─── Открыть меню выдачи ───
  bot.callbackQuery(CB.ADMIN_ISSUE, async (ctx) => {
    await ctx.answerCallbackQuery();

    const kb = new InlineKeyboard();
    // Показываем префиксы по 2 в ряд
    PHONE_PREFIXES.forEach((p, i) => {
      kb.text(`${p.flag} ${p.code}`, `${CB.ADMIN_ISSUE_PREFIX}:${p.code}`);
      if (i % 2 === 1) kb.row();
    });
    if (PHONE_PREFIXES.length % 2 === 1) kb.row();

    kb.text('🎲 Случайный', CB.ADMIN_ISSUE_RANDOM).row();
    kb.text('◀️ Назад', CB.MENU_HOME);

    await ctx.editMessageText(
      '📱 *Выдача номера*\n\n' +
      'Выбери префикс или сгенерируй случайный:',
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Выбор префикса ───
  bot.callbackQuery(new RegExp(`^${CB.ADMIN_ISSUE_PREFIX}:(.+)$`), async (ctx) => {
    const prefix = ctx.match[1];
    await ctx.answerCallbackQuery();
    await generateAndShow(ctx, prefix);
  });

  // ─── Случайный префикс ───
  bot.callbackQuery(CB.ADMIN_ISSUE_RANDOM, async (ctx) => {
    await ctx.answerCallbackQuery();
    const random = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
    await generateAndShow(ctx, random.code);
  });

  // ─── Перегенерировать ───
  bot.callbackQuery(CB.ADMIN_ISSUE_AGAIN, async (ctx) => {
    await ctx.answerCallbackQuery();
    // Забираем префикс из текущего сообщения (сохранён в сессии или парсим текст)
    const prefix = ctx.session?.lastPrefix || '+666';
    await generateAndShow(ctx, prefix);
  });

  // ─── Отправить юзеру ───
  bot.callbackQuery(CB.ADMIN_ISSUE_SEND, async (ctx) => {
    const phone = ctx.session?.lastPhone;
    if (!phone) {
      return ctx.answerCallbackQuery({
        text: 'Сначала сгенерируй номер',
        show_alert: true,
      });
    }

    await ctx.answerCallbackQuery('Сохранено');
    await ctx.editMessageText(
      `✅ *Номер выдан*\n\n` +
      `📞 \`${phone}\`\n\n` +
      `Номер сохранён в БД. Юзер может использовать его на сайте.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });
}

// ─── Внутренняя функция: сгенерировать и показать ───
async function generateAndShow(ctx, prefix) {
  // Генерируем номер
  let phone = generatePhone(prefix);

  // Проверяем уникальность (до 10 попыток)
  for (let i = 0; i < 10; i++) {
    const exists = await prisma.issuedPhone.findUnique({ where: { phone } });
    if (!exists) break;
    phone = generatePhone(prefix);
  }

  // Сохраняем в БД
  const expiresAt = new Date(Date.now() + AUTH.PHONE_TTL_HOURS * 60 * 60 * 1000);

  await prisma.issuedPhone.create({
    data: {
      phone,
      prefix,
      issuedBy: String(config.ADMIN_TG_ID),
      expiresAt,
    },
  });

  // Сохраняем в сессию для следующих кнопок
  ctx.session = ctx.session || {};
  ctx.session.lastPhone = phone;
  ctx.session.lastPrefix = prefix;

  const kb = new InlineKeyboard()
    .text('📤 Сохранить', CB.ADMIN_ISSUE_SEND).row()
    .text('🔄 Другой номер', CB.ADMIN_ISSUE_AGAIN).row()
    .text('◀️ Назад', CB.ADMIN_ISSUE);

  await ctx.editMessageText(
    `📞 *Сгенерирован номер:*\n\n` +
    `\`${phone}\`\n\n` +
    `Префикс: ${prefix}\n` +
    `Действует: ${AUTH.PHONE_TTL_HOURS} ч.`,
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}
