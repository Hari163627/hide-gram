// server/src/bots/user/gifts.js
// Мои подарки, магазин, передача подарков другим юзерам.

import { InlineKeyboard } from 'grammy';
import { prisma } from '../../prisma.js';
import { CB, STARS } from '../../../../shared/constants.js';
import { GIFTS, GIFT_RARITY, getGiftById } from '../../../../shared/gifts.js';
import { backButton } from './menu.js';

export function registerGiftHandlers(bot) {
  // ═══════════════════════════════════════════
  // МОИ ПОДАРКИ
  // ═══════════════════════════════════════════
  bot.callbackQuery(CB.USER_GIFTS, async (ctx) => {
    await ctx.answerCallbackQuery();

    const tgId = String(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { tgId } });
    if (!user) {
      return ctx.answerCallbackQuery({
        text: 'Сначала зарегистрируйся в вебе',
        show_alert: true,
      });
    }

    const myGifts = await prisma.gift.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const kb = new InlineKeyboard();

    if (myGifts.length > 0) {
      myGifts.forEach((g) => {
        const def = getGiftById(g.typeId);
        if (def) {
          kb.text(
            `${def.emoji} ${def.name} #${String(g.serial).padStart(4, '0')}`,
            `user:gift:view:${g.id}`
          ).row();
        }
      });
      kb.row();
    }

    kb.text('🛒 Магазин подарков', CB.USER_GIFTS_SHOP).row();
    kb.text('◀️ Назад', CB.MENU_HOME);

    const text = myGifts.length === 0
      ? '🎁 *Мои подарки*\n\nУ тебя пока нет подарков.\n\nЗагляни в магазин — там есть что-то для тебя!'
      : `🎁 *Мои подарки* (${myGifts.length})\n\nНажми на подарок, чтобы посмотреть детали:`;

    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  });

  // ═══════════════════════════════════════════
  // ДЕТАЛИ ПОДАРКА
  // ═══════════════════════════════════════════
  bot.callbackQuery(/^user:gift:view:(.+)$/, async (ctx) => {
    const giftId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) {
      return ctx.answerCallbackQuery({
        text: 'Подарок не найден',
        show_alert: true,
      });
    }

    const def = getGiftById(gift.typeId);
    const rarity = GIFT_RARITY[gift.rarity];

    const kb = new InlineKeyboard()
      .text('📤 Передать (25⭐)', `user:gift:transfer:${gift.id}`).row()
      .text('💰 Выставить на продажу', `user:gift:sell:${gift.id}`).row()
      .text('◀️ Назад', CB.USER_GIFTS);

    await ctx.editMessageText(
      `${def.emoji} *${def.name}*\n\n` +
      `Редкость: *${rarity.label}*\n` +
      `Серийный: #${String(gift.serial).padStart(4, '0')}/${def.supply || '∞'}\n` +
      `NFT ID: \`${gift.nftId}\`\n` +
      (gift.message ? `\n💌 _${gift.message}_\n` : '') +
      `\n*Атрибуты:*\n` +
      `• Model: ${def.model}\n` +
      `• Symbol: ${def.symbol}\n` +
      `• Backdrop: ${def.backdrop}`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ═══════════════════════════════════════════
  // МАГАЗИН
  // ═══════════════════════════════════════════
  bot.callbackQuery(CB.USER_GIFTS_SHOP, async (ctx) => {
    await ctx.answerCallbackQuery();

    const kb = new InlineKeyboard();

    for (const rarity of ['legendary', 'epic', 'rare', 'common']) {
      const gifts = GIFTS.filter((g) => g.rarity === rarity && g.forSale);
      if (gifts.length === 0) continue;

      kb.text(`— ${GIFT_RARITY[rarity].label} —`, 'noop').row();

      gifts.slice(0, 6).forEach((g, i) => {
        kb.text(
          `${g.emoji} ${g.name} • ${g.price}⭐`,
          `user:gift:shop_view:${g.typeId}`
        ).row();
      });
    }

    kb.text('◀️ Назад', CB.USER_GIFTS);

    await ctx.editMessageText(
      '🛒 *Магазин подарков*\n\n' +
      'Все подарки уникальны. Некоторые имеют ограниченный тираж.\n\n' +
      'Выбери подарок:',
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ═══════════════════════════════════════════
  // ПРОСМОТР ПОДАРКА В МАГАЗИНЕ
  // ═══════════════════════════════════════════
  bot.callbackQuery(/^user:gift:shop_view:(.+)$/, async (ctx) => {
    const typeId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const def = getGiftById(typeId);
    if (!def) {
      return ctx.answerCallbackQuery({ text: 'Подарок не найден', show_alert: true });
    }

    // Считаем, сколько выпущено
    const mintedCount = await prisma.gift.count({ where: { typeId } });
    const available = def.supply === null
      ? '∞ (безлимит)'
      : `${Math.max(0, def.supply - mintedCount)} из ${def.supply}`;

    const rarity = GIFT_RARITY[def.rarity];

    const kb = new InlineKeyboard()
      .text(`💰 Купить за ${def.price}⭐`, `user:gift:buy:${typeId}`).row()
      .text('◀️ Назад', CB.USER_GIFTS_SHOP);

    await ctx.editMessageText(
      `${def.emoji} *${def.name}*\n\n` +
      `_${def.desc}_\n\n` +
      `Редкость: *${rarity.label}*\n` +
      `Цена: *${def.price}⭐*\n` +
      `Доступно: ${available}\n\n` +
      `*Атрибуты:*\n` +
      `• Model: ${def.model}\n` +
      `• Symbol: ${def.symbol}\n` +
      `• Backdrop: ${def.backdrop}`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ═══════════════════════════════════════════
  // КУПИТЬ ПОДАРОК
  // ═══════════════════════════════════════════
  bot.callbackQuery(/^user:gift:buy:(.+)$/, async (ctx) => {
    const typeId = ctx.match[1];
    await ctx.answerCallbackQuery();

    const tgId = String(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { tgId } });
    const def = getGiftById(typeId);

    if (!user || !def) {
      return ctx.answerCallbackQuery({ text: 'Ошибка', show_alert: true });
    }

    // Проверка баланса
    if (user.stars < def.price) {
      const kb = new InlineKeyboard()
        .text('💰 Купить звёзды', CB.USER_STARS_BUY).row()
        .text('◀️ Назад', CB.USER_GIFTS_SHOP);

      return ctx.editMessageText(
        `❌ *Недостаточно звёзд*\n\n` +
        `Нужно: *${def.price}⭐*\n` +
        `У тебя: *${user.stars}⭐*\n\n` +
        `Не хватает: *${def.price - user.stars}⭐*`,
        {
          parse_mode: 'Markdown',
          reply_markup: kb,
        }
      );
    }

    // Проверка supply
    const mintedCount = await prisma.gift.count({ where: { typeId } });
    if (def.supply !== null && mintedCount >= def.supply) {
      return ctx.answerCallbackQuery({
        text: 'Тираж исчерпан',
        show_alert: true,
      });
    }

    // Списываем звёзды
    await prisma.user.update({
      where: { id: user.id },
      data: { stars: { decrement: def.price } },
    });

    // Создаём подарок
    const serial = mintedCount + 1;
    const nftId = `hg_${typeId}_${String(serial).padStart(4, '0')}`;

    await prisma.gift.create({
      data: {
        nftId,
        typeId,
        serial,
        ownerId: user.id,
        origin: 'shop',
      },
    });

    // Транзакция
    await prisma.starTransaction.create({
      data: {
        userId: user.id,
        amount: -def.price,
        type: 'purchase',
        description: `Покупка ${def.name}`,
        metadata: { typeId, nftId },
      },
    });

    const kb = new InlineKeyboard()
      .text('🎁 Мои подарки', CB.USER_GIFTS).row()
      .text('🛒 Ещё в магазин', CB.USER_GIFTS_SHOP);

    await ctx.editMessageText(
      `✅ *Покупка успешна!*\n\n` +
      `${def.emoji} *${def.name}*\n` +
      `Серийный: #${String(serial).padStart(4, '0')}/${def.supply || '∞'}\n\n` +
      `Списано: *${def.price}⭐*\n` +
      `Осталось: *${user.stars - def.price}⭐*`,
      {
        parse_mode: 'Markdown',
        reply_markup: kb,
      }
    );
  });

  // ═══════════════════════════════════════════
  // ПЕРЕДАЧА ПОДАРКА (заглушка, реализуем позже)
  // ═══════════════════════════════════════════
  bot.callbackQuery(/^user:gift:transfer:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: 'Передача через веб-версию (в разработке)',
      show_alert: true,
    });
  });

  // Продажа (заглушка)
  bot.callbackQuery(/^user:gift:sell:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery({
      text: 'Маркет в разработке',
      show_alert: true,
    });
  });
}
