// server/src/bots/admin/gift.js
// Выдача NFT-подарков юзерам от имени админа.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { config } from '../../config.js';
import { CB } from '../../../../shared/constants.js';
import { GIFTS, getGiftById, makeNftId, GIFT_RARITY } from '../../../../shared/gifts.js';
import { backButton } from './menu.js';

export function registerGiftHandlers(bot) {
  // ─── Открыть меню выдачи ───
  bot.callbackQuery(CB.ADMIN_GRANT_GIFT, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showGiftPicker(ctx);
  });

  // ─── Выбор подарка ───
  bot.callbackQuery(/^admin:gift:pick:(.+)$/, async (ctx) => {
    const typeId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const gift = getGiftById(typeId);
    if (!gift) {
      return ctx.answerCallbackQuery({
        text: 'Подарок не найден',
        show_alert: true,
      });
    }

    await showUserPickerForGift(ctx, gift);
  });

  // ─── Выбор юзера ───
  bot.callbackQuery(/^admin:gift:user:(.+):(.+)$/, async (ctx) => {
    const typeId = ctx.match[1];
    const userId = ctx.match[2];
    await ctx.answerCallbackQuery();

    const gift = getGiftById(typeId);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!gift || !user) {
      return ctx.answerCallbackQuery({
        text: 'Ошибка',
        show_alert: true,
      });
    }

    // Считаем, сколько уже выпущено
    const mintedCount = await prisma.gift.count({
      where: { typeId },
    });

    // Проверяем supply
    if (gift.supply !== null && mintedCount >= gift.supply) {
      return ctx.answerCallbackQuery({
        text: `Тираж исчерпан (${mintedCount}/${gift.supply})`,
        show_alert: true,
      });
    }

    // Создаём подарок
    const serial = mintedCount + 1;
    const nftId = makeNftId(typeId, serial);

    const newGift = await prisma.gift.create({
      data: {
        nftId,
        typeId,
        serial,
        ownerId: userId,
        fromId: null,
        origin: 'admin',
      },
    });

    // Логируем
    await prisma.adminLog.create({
      data: {
        adminTgId: String(config.ADMIN_TG_ID),
        action: 'grant_gift',
        targetId: userId,
        payload: { typeId, nftId, serial },
      },
    });

    // Отправляем уведомление юзеру
    try {
      const { sendMessageToUser } = await import('../user/index.js');
      await sendMessageToUser(
        user.tgId,
        `🎁 *Ты получил подарок!*\n\n` +
        `${gift.emoji} *${gift.name}*\n` +
        `Редкость: ${GIFT_RARITY[gift.rarity].label}\n` +
        `Серийный номер: #${String(serial).padStart(4, '0')}/${gift.supply || '∞'}\n\n` +
        `Открой Hide Gram, чтобы посмотреть.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Не удалось уведомить юзера:', err);
    }

    await ctx.editMessageText(
      `✅ *Подарок выдан*\n\n` +
      `${gift.emoji} ${gift.name}\n` +
      `Получатель: @${user.username}\n` +
      `Серийный: #${String(serial).padStart(4, '0')}/${gift.supply || '∞'}\n` +
      `NFT ID: \`${nftId}\``,
      {
        parse_mode: 'Markdown',
        reply_markup: backButton(),
      }
    );
  });
}

// ─── Меню выбора подарка (по редкости) ───
async function showGiftPicker(ctx) {
  const kb = new InlineKeyboard();

  // Показываем по редкости
  for (const rarity of ['legendary', 'epic', 'rare', 'common']) {
    const gifts = GIFTS.filter((g) => g.rarity === rarity);
    if (gifts.length === 0) continue;

    kb.text(`— ${GIFT_RARITY[rarity].label} —`, 'noop').row();

    // По 2 в ряд
    gifts.forEach((g, i) => {
      kb.text(
        `${g.emoji} ${g.name}`,
        `admin:gift:pick:${g.typeId}`
      );
      if (i % 2 === 1) kb.row();
    });
    if (gifts.length % 2 === 1) kb.row();
  }

  kb.text('◀️ Назад', CB.MENU_HOME);

  await ctx.editMessageText(
    '🎁 *Выдача подарка*\n\nВыбери подарок:',
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}

// ─── Меню выбора юзера ───
async function showUserPickerForGift(ctx, gift) {
  const users = await prisma.user.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, displayName: true },
  });

  if (users.length === 0) {
    return ctx.editMessageText('Юзеров нет.', { reply_markup: backButton() });
  }

  const kb = new InlineKeyboard();
  users.forEach((u) => {
    kb.text(
      `@${u.username}`,
      `admin:gift:user:${gift.typeId}:${u.id}`
    ).row();
  });
  kb.text('◀️ Назад', CB.ADMIN_GRANT_GIFT);

  await ctx.editMessageText(
    `${gift.emoji} *${gift.name}*\n\n` +
    `Кому выдать?`,
    {
      parse_mode: 'Markdown',
      reply_markup: kb,
    }
  );
}
