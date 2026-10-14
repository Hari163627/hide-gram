// shared/gifts.js
// Каталог NFT-подарков Hide Gram.
// Используется: в Admin-боте, User-боте, на фронте.
// Поле `typeId` — уникальный код, используется в callback_data ботов.

export const GIFT_RARITY = {
  common: {
    id: "common",
    label: "Common",
    color: "#8a9aa8",
    gradient: ["#8a9aa8", "#5c6a78"],
    glow: "rgba(138,154,168,0.3)",
  },
  rare: {
    id: "rare",
    label: "Rare",
    color: "#3b9eff",
    gradient: ["#3b9eff", "#1a5fb4"],
    glow: "rgba(59,158,255,0.4)",
  },
  epic: {
    id: "epic",
    label: "Epic",
    color: "#b34bff",
    gradient: ["#b34bff", "#6a1fb0"],
    glow: "rgba(179,75,255,0.5)",
  },
  legendary: {
    id: "legendary",
    label: "Legendary",
    color: "#ffb020",
    gradient: ["#ffb020", "#c07800"],
    glow: "rgba(255,176,32,0.6)",
  },
};

// ─── Каталог ───
// supply: null = безлимитный (можно выпускать сколько угодно)
// price: цена в звёздах Hide Gram
// forSale: продаётся ли сейчас в магазине от разработчика
export const GIFTS = [
  // ═════════ ТВОЙ СПИСОК ═════════
  {
    typeId: "pepe",
    name: "Plush Pepe",
    emoji: "🐸",
    rarity: "legendary",
    supply: 3000,
    price: 500,
    forSale: true,
    desc: "Легендарная жаба, символ Hide Gram",
    model: "Gummy Frog",
    symbol: "⚡ Lightning",
    backdrop: "🌌 Cosmic",
  },
  {
    typeId: "cigar",
    name: "Cigar",
    emoji: "🚬",
    rarity: "common",
    supply: null,
    price: 5,
    forSale: true,
    desc: "Сигара в зубах, стиль don",
    model: "Classic",
    symbol: "💨 Smoke",
    backdrop: "🌫 Fog",
  },
  {
    typeId: "ice_cream",
    name: "Ice Cream",
    emoji: "🍦",
    rarity: "common",
    supply: null,
    price: 5,
    forSale: true,
    desc: "Мороженое, летний вайб",
    model: "Vanilla",
    symbol: "🍓 Berry",
    backdrop: "☀️ Sunny",
  },
  {
    typeId: "torch",
    name: "Torch",
    emoji: "🔥",
    rarity: "rare",
    supply: 500,
    price: 25,
    forSale: true,
    desc: "Факел, символ движения",
    model: "Olympic",
    symbol: "🔥 Flame",
    backdrop: "🌋 Volcano",
  },
  {
    typeId: "blue_box",
    name: "Blue Box",
    emoji: "📦",
    rarity: "epic",
    supply: 100,
    price: 75,
    forSale: true,
    desc: "Синяя коробка — сюрприз внутри",
    model: "Mystery",
    symbol: "💙 Blue",
    backdrop: "💠 Crystal",
  },
  {
    typeId: "durov",
    name: "Durov's Cap",
    emoji: "🧢",
    rarity: "legendary",
    supply: 5000,
    price: 400,
    forSale: true,
    desc: "Кепка самого Павла, в очках",
    model: "Classic",
    symbol: "🕶 Cool",
    backdrop: "🔵 Blue",
  },
  {
    typeId: "cap",
    name: "Cap",
    emoji: "🧢",
    rarity: "common",
    supply: null,
    price: 5,
    forSale: true,
    desc: "Кепка, базовая классика",
    model: "Snapback",
    symbol: "🎩 Style",
    backdrop: "⚪ Plain",
  },

  // ═════════ ДОПОЛНИТЕЛЬНЫЕ ═════════
  {
    typeId: "diamond_ring",
    name: "Diamond Ring",
    emoji: "💍",
    rarity: "epic",
    supply: 200,
    price: 100,
    forSale: true,
    desc: "Кольцо с бриллиантом",
    model: "Solitaire",
    symbol: "💎 Diamond",
    backdrop: "✨ Sparkle",
  },
  {
    typeId: "rocket",
    name: "Rocket",
    emoji: "🚀",
    rarity: "rare",
    supply: 500,
    price: 30,
    forSale: true,
    desc: "To the moon",
    model: "Falcon",
    symbol: "🔥 Thrust",
    backdrop: "🌌 Space",
  },
  {
    typeId: "lucky_cat",
    name: "Lucky Cat",
    emoji: "🐱",
    rarity: "rare",
    supply: 777,
    price: 35,
    forSale: true,
    desc: "Манэки-нэко, приносит удачу",
    model: "Maneki",
    symbol: "🍀 Luck",
    backdrop: "🏮 Red",
  },
  {
    typeId: "crown",
    name: "Crown",
    emoji: "👑",
    rarity: "legendary",
    supply: 10,
    price: 999,
    forSale: true,
    desc: "Корона для топов",
    model: "Royal",
    symbol: "💎 Gem",
    backdrop: "👑 Gold",
  },
  {
    typeId: "crystal_ball",
    name: "Crystal Ball",
    emoji: "🔮",
    rarity: "epic",
    supply: 150,
    price: 80,
    forSale: true,
    desc: "Шар предсказаний",
    model: "Mystic",
    symbol: "🌙 Moon",
    backdrop: "🔮 Purple",
  },
  {
    typeId: "skull",
    name: "Skull",
    emoji: "💀",
    rarity: "rare",
    supply: 666,
    price: 40,
    forSale: true,
    desc: "Череп, тёмная эстетика",
    model: "Pirate",
    symbol: "⚔ Cross",
    backdrop: "🖤 Black",
  },
  {
    typeId: "heart",
    name: "Heart",
    emoji: "💖",
    rarity: "common",
    supply: null,
    price: 5,
    forSale: true,
    desc: "Сердце, базовая валентинка",
    model: "Sweet",
    symbol: "💕 Love",
    backdrop: "🌸 Pink",
  },
  {
    typeId: "star",
    name: "Star",
    emoji: "⭐",
    rarity: "common",
    supply: null,
    price: 1,
    forSale: true,
    desc: "Звезда, стартовый подарок",
    model: "Classic",
    symbol: "✨ Shine",
    backdrop: "🌃 Night",
  },
  {
    typeId: "bear",
    name: "Bear",
    emoji: "🧸",
    rarity: "common",
    supply: null,
    price: 5,
    forSale: true,
    desc: "Мишка, милота",
    model: "Teddy",
    symbol: "🍯 Honey",
    backdrop: "🌲 Forest",
  },
  {
    typeId: "champagne",
    name: "Champagne",
    emoji: "🍾",
    rarity: "epic",
    supply: 300,
    price: 90,
    forSale: true,
    desc: "Бутылка шампанского, праздник",
    model: "Moet",
    symbol: "🎉 Party",
    backdrop: "🥂 Gold",
  },
  {
    typeId: "alien",
    name: "Alien",
    emoji: "👽",
    rarity: "legendary",
    supply: 42,
    price: 350,
    forSale: true,
    desc: "Пришелец, редкость",
    model: "Area 51",
    symbol: "🛸 UFO",
    backdrop: "🌌 Nebula",
  },
  {
    typeId: "santa_hat",
    name: "Santa Hat",
    emoji: "🎅",
    rarity: "common",
    supply: null,
    price: 10,
    forSale: true,
    desc: "Новогодняя шапка",
    model: "Classic",
    symbol: "🎄 Christmas",
    backdrop: "❄️ Winter",
  },
  {
    typeId: "jelly_bunny",
    name: "Jelly Bunny",
    emoji: "🐰",
    rarity: "rare",
    supply: 10000,
    price: 20,
    forSale: true,
    desc: "Пасхальный кролик",
    model: "Jelly",
    symbol: "🥚 Easter",
    backdrop: "🌸 Spring",
  },
  {
    typeId: "spiced_wine",
    name: "Spiced Wine",
    emoji: "🍷",
    rarity: "rare",
    supply: 8000,
    price: 25,
    forSale: true,
    desc: "Глинтвейн, зимний вайб",
    model: "Mulled",
    symbol: "🍊 Orange",
    backdrop: "🔥 Fireplace",
  },
];

// ─── Хелперы ───

// Получить подарок по typeId
export const getGiftById = (typeId) =>
  GIFTS.find((g) => g.typeId === typeId);

// Сгруппировать по редкости (для витрины)
export const getGiftsByRarity = () =>
  GIFTS.reduce((acc, gift) => {
    (acc[gift.rarity] ||= []).push(gift);
    return acc;
  }, {});

// Только те, что продаются
export const getShopGifts = () =>
  GIFTS.filter((g) => g.forSale);

// Проверка: можно ли выпустить ещё (учёт supply)
export const canMint = (gift, alreadyMinted) => {
  if (gift.supply === null) return true;
  return alreadyMinted < gift.supply;
};

// Генерация nftId вида "hg_pepe_0001"
export const makeNftId = (typeId, serial) => {
  const cleanType = typeId.replace(/[^a-z0-9]/gi, "_");
  const paddedSerial = String(serial).padStart(4, "0");
  return `hg_${cleanType}_${paddedSerial}`;
};
