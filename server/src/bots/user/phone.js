// server/src/bots/user/phone.js
// Получение номера для регистрации в веб-версии.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { CB, PHONE_PREFIXES, AUTH } from '../../../../shared/constants.js';
import { generatePhone } from '../../utils/random.js';
import { backButton } from './menu.js';

export function registerPhoneHandlers(bot) {
  // ─── Открыть меню выбора префикса ───
  bot.callbackQuery(CB.USER_GET_PHONE, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showPrefixPicker(ctx);
  });

  // ─── Выбор префикса → генерация номера ───
  bot.callbackQuery(/^user:phone:prefix:(.+)$/, async (ctx) => {
    const prefix = ctx.match[1];
    await ctx.answerCallbackQuery();
    await generateAndShow(ctx, prefix, ctx.from.id);
  });

  // ─── Перегенерировать ───
  bot.callbackQuery(CB.USER_PHONE_REGENERATE, async (ctx) => {
    await ctx.answerCallbackQuery();

    const prefix = ctx.session?.data?.prefix;
    if (!prefix) {
      return ctx.answerCallbackQuery({
        text: 'Сначала выбери префикс',
        show_alert: true,
      });
    }
    await generateAndShow(ctx, prefix, ctx.from.id, true);
  });
}

// ─── Показать префиксы ───
async function showPrefixPicker(ctx) {
  const kb = new InlineKeyboard();

  PHONE_PREFIXES.forEach((p, i) => {
    kb.text(`${p.flag} ${p.code}`, `${CB.USER_PHONE_PREFIX}:${p.code}`);
    if (i % 2 === 1) kb.row();
  });
  if (PHONE_PREFIXES.length % 2 === 1) kb.row();

  kb.text('◀️ Назад', CB.MENU_HOME);

  await ctx.editMessageText(
    '📱 *Получение номера*\n\n' +
    'Выбери префикс — мы сгенерируем тебе уникальный номер.\n\n' +
    'После этого зайди на сайт Hide Gram и введи его.',
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}

// ─── Сгенерировать и показать номер ───
async function generateAndShow(ctx, prefix, tgId, regenerate = false) {
  // Если перегенерируем — удаляем старый неиспользованный
  if (regenerate) {
    await prisma.issuedPhone.deleteMany({
      where: {
        issuedTo: String(tgId),
        used: false,
      },
    });
  }

  // Проверяем — может, у юзера уже есть активный номер
  const existing = await prisma.issuedPhone.findFirst({
    where: {
      issuedTo: String(tgId),
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  let phone;

  if (existing && !regenerate) {
    phone = existing.phone;
  } else {
    // Генерируем новый
    phone = generatePhone(prefix);

    // Проверяем уникальность (до 10 попыток)
    for (let i = 0; i < 10; i++) {
      const exists = await prisma.issuedPhone.findUnique({ where: { phone } });
      if (!exists) break;
      phone = generatePhone(prefix);
    }

    const expiresAt = new Date(Date.now() + AUTH.PHONE_TTL_HOURS * 60 * 60 * 1000);

    await prisma.issuedPhone.create({
      data: {
        phone,
        prefix,
        issuedTo: String(tgId),
        expiresAt,
      },
    });
  }

  // Сохраняем в сессию
  ctx.session = ctx.session || { step: null, data: {} };
  ctx.session.data = ctx.session.data || {};
  ctx.session.data.prefix = prefix;
  ctx.session.data.phone = phone;

  const kb = new InlineKeyboard()
    .url('🌐 Открыть Web', 'https://hide-gram-web.onrender.com').row()
    .text('🔄 Другой номер', CB.USER_PHONE_REGENERATE).row()
    .text('◀️ Назад', CB.USER_GET_PHONE);

  await ctx.editMessageText(
    `✅ *Твой номер готов!*\n\n` +
    `📞 \`${phone}\`\n\n` +
    `*Как использовать:*\n` +
    `1. Открой веб-версию Hide Gram\n` +
    `2. Введи этот номер\n` +
    `3. Сюда, в этот бот, придёт код\n` +
    `4. Введи код на сайте — готово!\n\n` +
    `_Номер действует ${AUTH.PHONE_TTL_HOURS} часа._`,
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}
