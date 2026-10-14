// server/src/bots/user/index.js
// User-бот Hide Gram.
// Регистрация, получение номеров, звёзды, подарки.

import { Bot, session } from 'grammy';
import { config } from '../../config.js';
import { registerMenuHandlers } from './menu.js';
import { registerPhoneHandlers } from './phone.js';
import { registerStarsHandlers } from './stars.js';
import { registerGiftHandlers } from './gifts.js';
import { registerProfileHandlers } from './profile.js';

let userBotInstance = null;

export async function startUserBot() {
  console.log('🤖 Запуск User-бота...');

  const bot = new Bot(config.BOT_TOKEN_USER);

  // ─── Сессия ───
  bot.use(session({
    initial: () => ({
      // Состояние диалога
      step: null,
      data: {},
    }),
  }));

  // ─── /start → главное меню ───
  bot.command('start', async (ctx) => {
    const { mainMenu, MAIN_MENU_TEXT } = await import('./menu.js');
    await ctx.reply(MAIN_MENU_TEXT, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu(),
    });
  });

  // ─── /cancel — сброс состояния ───
  bot.command('cancel', async (ctx) => {
    ctx.session.step = null;
    ctx.session.data = {};
    const { mainMenu, MAIN_MENU_TEXT } = await import('./menu.js');
    await ctx.reply(MAIN_MENU_TEXT, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu(),
    });
  });

  // ─── Регистрация хендлеров ───
  registerMenuHandlers(bot);
  registerPhoneHandlers(bot);
  registerStarsHandlers(bot);
  registerGiftHandlers(bot);
  registerProfileHandlers(bot);

  // ─── Обработка ошибок ───
  bot.catch((err) => {
    console.error('❌ User bot error:', err);
  });

  // ─── Запуск: webhook или polling ───
  if (config.isProd) {
    const webhookUrl = `${config.PUBLIC_URL}/webhook/user`;
    await bot.api.setWebhook(webhookUrl, {
      secret_token: config.BOT_TOKEN_USER.split(':')[0],
    });
    console.log(`   Webhook: ${webhookUrl}`);
  } else {
    bot.start({
      onStart: (info) => {
        console.log(`   ✅ User-бот @${info.username} запущен (polling)`);
      },
    });
  }

  userBotInstance = bot;
  return bot;
}

// ═══════════════════════════════════════════
// Хелпер для отправки сообщений из API
// Используется в auth.js, admin/gift.js, admin/stars.js
// ═══════════════════════════════════════════
export async function sendMessageToUser(tgId, text, options = {}) {
  if (!userBotInstance) {
    throw new Error('User bot not started');
  }
  if (!tgId) {
    throw new Error('No tgId provided');
  }
  return userBotInstance.api.sendMessage(tgId, text, options);
}

// Получить инстанс бота (для других мест)
export function getUserBot() {
  return userBotInstance;
}
