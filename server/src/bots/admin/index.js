// server/src/bots/admin/index.js
// Admin-бот Hide Gram.
// Доступен только ADMIN_TG_ID. Всё управление — через inline-кнопки.

import { Bot, session } from 'grammy';
import { config } from '../../config.js';
import { registerMenuHandlers } from './menu.js';
import { registerIssueHandlers } from './issue.js';
import { registerBanHandlers } from './ban.js';
import { registerVerifyHandlers } from './verify.js';
import { registerGiftHandlers } from './gift.js';
import { registerStarsHandlers } from './stars.js';
import { registerBroadcastHandlers } from './broadcast.js';
import { registerStatsHandlers } from './stats.js';
import { registerLogsHandlers } from './logs.js';

let adminBotInstance = null;

export async function startAdminBot() {
  console.log('🤖 Запуск Admin-бота...');

  const bot = new Bot(config.BOT_TOKEN_ADMIN);

  // ─── Middleware: только админ ───
  bot.use(async (ctx, next) => {
    const userId = String(ctx.from?.id);
    const adminId = String(config.ADMIN_TG_ID);

    if (userId !== adminId) {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({
          text: '⛔ Доступ запрещён',
          show_alert: true,
        }).catch(() => {});
      } else if (ctx.message) {
        await ctx.reply('⛔ Этот бот только для администратора.').catch(() => {});
      }
      return;
    }
    return next();
  });

  // ─── Сессия (для хранения промежуточных состояний) ───
  bot.use(session({
    initial: () => ({}),
  }));

  // ─── /start → главное меню ───
  bot.command('start', async (ctx) => {
    const { mainMenu } = await import('./menu.js');
    await ctx.reply(
      '🛡 *Hide Gram Admin*\n\n' +
      'Выбери действие:',
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu(),
      }
    );
  });

  // ─── Регистрация хендлеров ───
  registerMenuHandlers(bot);
  registerIssueHandlers(bot);
  registerBanHandlers(bot);
  registerVerifyHandlers(bot);
  registerGiftHandlers(bot);
  registerStarsHandlers(bot);
  registerBroadcastHandlers(bot);
  registerStatsHandlers(bot);
  registerLogsHandlers(bot);

  // ─── Обработка ошибок ───
  bot.catch((err) => {
    console.error('❌ Admin bot error:', err);
  });

  // ─── Запуск: webhook или polling ───
  if (config.isProd) {
    // В продакшене — webhook
    const webhookUrl = `${config.PUBLIC_URL}/webhook/admin`;
    await bot.api.setWebhook(webhookUrl, {
      secret_token: config.BOT_TOKEN_ADMIN.split(':')[0],
    });
    console.log(`   Webhook: ${webhookUrl}`);
  } else {
    // Локально — polling
    bot.start({
      onStart: (info) => {
        console.log(`   ✅ Admin-бот @${info.username} запущен (polling)`);
      },
    });
  }

  adminBotInstance = bot;
  return bot;
}

// Получить инстанс бота (для отправки сообщений из API)
export function getAdminBot() {
  return adminBotInstance;
}
