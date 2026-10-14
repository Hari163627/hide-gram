// server/src/bots/user/menu.js
// Главное меню User-бота.

import { InlineKeyboard } from 'grammy';
import { CB } from '../../../../shared/constants.js';

export const MAIN_MENU_TEXT =
  '👋 *Добро пожаловать в Hide Gram!*\n\n' +
  'Hide Gram — мессенджер с NFT-подарками, звёздами и полной свободой.\n\n' +
  'Выбери действие:';

export function mainMenu() {
  return new InlineKeyboard()
    .url('🌐 Открыть Web', 'https://hide-gram-web.onrender.com').row()
    .text('📱 Получить номер', CB.USER_GET_PHONE).row()
    .text('⭐ Мои звёзды', CB.USER_STARS)
    .text('🎁 Мои подарки', CB.USER_GIFTS).row()
    .text('👤 Профиль', CB.USER_PROFILE)
    .text('❓ Помощь', CB.USER_HELP);
}

// Кнопка «Назад» в главное меню
export function backButton() {
  return new InlineKeyboard().text('◀️ Назад', CB.MENU_HOME);
}

export function registerMenuHandlers(bot) {
  // Возврат в главное меню
  bot.callbackQuery(CB.MENU_HOME, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(MAIN_MENU_TEXT, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu(),
    });
  });

  // Помощь
  bot.callbackQuery(CB.USER_HELP, async (ctx) => {
    await ctx.answerCallbackQuery();

    const kb = new InlineKeyboard().text('◀️ Назад', CB.MENU_HOME);

    await ctx.editMessageText(
      '❓ *Помощь*\n\n' +
      '*Как начать?*\n' +
      '1. Нажми «📱 Получить номер» — бот выдаст тебе виртуальный номер\n' +
      '2. Открой веб-версию и введи этот номер\n' +
      '3. Бот пришлёт код — введи его на сайте\n' +
      '4. Готово! Ты в Hide Gram\n\n' +
      '*Что такое звёзды?*\n' +
      'Это внутренняя валюта. На них покупают подарки и переводят их другим.\n\n' +
      '*Что такое подарки?*\n' +
      'Это NFT-коллекция. Некоторые подарки имеют ограниченный тираж — их всего несколько штук на весь мир.\n\n' +
      '*Поддержка:* @HideGramSupport',
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });
}
