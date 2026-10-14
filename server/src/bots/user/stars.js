// server/src/bots/user/stars.js
// Баланс звёзд и покупка.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { CB, STARS } from '../../../../shared/constants.js';
import { backButton } from './menu.js';

export function registerStarsHandlers(bot) {
  // ─── Мои звёзды ───
  bot.callbackQuery(CB.USER_STARS, async (ctx) => {
    await ctx.answerCallbackQuery();

    const tgId = String(ctx.from.id);
    const user = await prisma.user.findUnique({
      where: { tgId },
      select: { stars: true, username: true },
    });

    const balance = user?.stars ?? 0;

    const kb = new InlineKeyboard()
      .text('💰 Купить звёзды', CB.USER_STARS_BUY).row()
      .text('◀️ Назад', CB.MENU_HOME);

    await ctx.editMessageText(
      `⭐ *Мои звёзды*\n\n` +
      `Баланс: *${balance}⭐*\n\n` +
      `*Что можно купить:*\n` +
      `🎁 Подарки — от 1⭐ до 999⭐\n` +
      `🔄 Перевод подарка другому — 25⭐\n` +
      `🚀 Повышение редкости — от 50⭐\n\n` +
      `_Звёзды покупаются за Telegram Stars или TON._`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Меню покупки ───
  bot.callbackQuery(CB.USER_STARS_BUY, async (ctx) => {
    await ctx.answerCallbackQuery();

    const kb = new InlineKeyboard();
    STARS.PACKS.forEach((pack) => {
      const label = pack.bonus > 0
        ? `${pack.stars}⭐ +${pack.bonus} бонус — $${pack.price}`
        : `${pack.stars}⭐ — $${pack.price}`;
      kb.text(label, `${CB.USER_STARS_PACK}:${pack.stars}`).row();
    });
    kb.text('◀️ Назад', CB.USER_STARS);

    await ctx.editMessageText(
      '💰 *Покупка звёзд*\n\n' +
      'Выбери пакет:',
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Выбор пакета ───
  bot.callbackQuery(/^user:stars:pack:(\d+)$/, async (ctx) => {
    const starsAmount = Number(ctx.match[1]);
    const pack = STARS.PACKS.find((p) => p.stars === starsAmount);

    if (!pack) {
      return ctx.answerCallbackQuery({
        text: 'Пакет не найден',
        show_alert: true,
      });
    }

    await ctx.answerCallbackQuery();

    const kb = new InlineKeyboard()
      .text('⭐ Оплатить Telegram Stars', `user:stars:pay_tg:${starsAmount}`).row()
      .text('💎 Оплатить TON', `user:stars:pay_ton:${starsAmount}`).row()
      .text('◀️ Назад', CB.USER_STARS_BUY);

    await ctx.editMessageText(
      `💰 *Покупка ${starsAmount}⭐*\n\n` +
      (pack.bonus > 0 ? `Бонус: +${pack.bonus}⭐\n` : '') +
      `Цена: *$${pack.price}*\n\n` +
      `Выбери способ оплаты:`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ─── Оплата Telegram Stars (заглушка — реализуем позже) ───
  bot.callbackQuery(/^user:stars:pay_tg:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: 'Оплата Telegram Stars временно недоступна',
      show_alert: true,
    });
  });

  // ─── Оплата TON (заглушка) ───
  bot.callbackQuery(/^user:stars:pay_ton:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: 'Оплата TON временно недоступна',
      show_alert: true,
    });
  });
}
