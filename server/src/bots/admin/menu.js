// server/src/bots/admin/menu.js
// Главное меню Admin-бота и навигация назад.

import { InlineKeyboard } from 'grammy';
import { CB } from '../../../../shared/constants.js';

// ─── Главное меню ───
export function mainMenu() {
  return new InlineKeyboard()
    .text('📱 Выдать номер', CB.ADMIN_ISSUE).row()
    .text('🚫 Забанить', CB.ADMIN_BAN)
    .text('✅ Разбанить', CB.ADMIN_UNBAN).row()
    .text('⭐ Выдать галочку', CB.ADMIN_VERIFY)
    .text('⚪ Снять галочку', CB.ADMIN_UNVERIFY).row()
    .text('🎁 Выдать подарок', CB.ADMIN_GRANT_GIFT).row()
    .text('💰 Выдать звёзды', CB.ADMIN_GRANT_STARS).row()
    .text('📊 Статистика', CB.ADMIN_STATS)
    .text('👥 Пользователи', CB.ADMIN_USERS_LIST).row()
    .text('📢 Рассылка', CB.ADMIN_BROADCAST)
    .text('📋 Логи', CB.ADMIN_LOGS);
}

// Текст главного меню
export const MENU_TEXT =
  '🛡 *Hide Gram Admin*\n\n' +
  'Выбери действие:';

// ─── Регистрация хендлеров ───
export function registerMenuHandlers(bot) {
  // Навигация «назад» в главное меню
  bot.callbackQuery(CB.MENU_HOME, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(MENU_TEXT, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu(),
    });
  });

  bot.callbackQuery(CB.MENU_BACK, async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(MENU_TEXT, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu(),
    });
  });

  // Закрыть меню
  bot.callbackQuery(CB.MENU_CLOSE, async (ctx) => {
    await ctx.answerCallbackQuery('Закрыто');
    await ctx.deleteMessage().catch(() => {});
  });
}

// Утилита: кнопка «Назад» в главное меню
export function backButton() {
  return new InlineKeyboard().text('◀️ Назад', CB.MENU_HOME);
}
