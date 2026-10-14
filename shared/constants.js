// shared/constants.js
// Общие константы для клиента, сервера и ботов.
// Меняешь здесь — меняется везде.

// ═══════════════════════════════════════════
// ПРЕФИКСЫ НОМЕРОВ
// ═══════════════════════════════════════════
// Юзер в боте выбирает префикс — бот генерирует номер.
// Ты, админ, можешь выдать любой из этих или свой вручную.
export const PHONE_PREFIXES = [
  { code: "+1",   country: "США/Канада", flag: "🇺🇸" },
  { code: "+7",   country: "Россия/Казахстан", flag: "🇷🇺" },
  { code: "+380", country: "Украина",    flag: "🇺🇦" },
  { code: "+000", country: "Hide Gram",  flag: "🌐" },
  { code: "+222", country: "Hide Gram",  flag: "🌐" },
  { code: "+666", country: "Hide Gram",  flag: "😈" },
  { code: "+777", country: "Hide Gram",  flag: "🎰" },
  { code: "+888", country: "Hide Gram",  flag: "♾️" },
  { code: "+999", country: "Hide Gram",  flag: "💎" },
];

// ═══════════════════════════════════════════
// ЗВЁЗДЫ (внутренняя валюта)
// ═══════════════════════════════════════════
export const STARS = {
  // Комиссия за P2P-передачу подарка (звёзд)
  TRANSFER_FEE: 25,
  // Минимальная покупка звёзд
  MIN_PURCHASE: 100,
  // Пакеты для покупки (звёзд → цена в USD)
  PACKS: [
    { stars: 100,  price: 1.99,  bonus: 0 },
    { stars: 500,  price: 9.99,  bonus: 25 },
    { stars: 1000, price: 19.99, bonus: 100 },
    { stars: 5000, price: 99.99, bonus: 750 },
  ],
};

// ═══════════════════════════════════════════
// РЕГИСТРАЦИЯ
// ═══════════════════════════════════════════
export const AUTH = {
  CODE_LENGTH: 6,                 // длина кода подтверждения
  CODE_TTL_MINUTES: 5,            // сколько живёт код
  CODE_MAX_ATTEMPTS: 3,           // попыток ввода кода
  PHONE_TTL_HOURS: 24,            // сколько живёт выданный номер
  SESSION_DAYS: 30,               // срок жизни cookie-сессии
};

// ═══════════════════════════════════════════
// CALLBACK-КОДЫ ДЛЯ INLINE-КНОПОК БОТОВ
// ═══════════════════════════════════════════
// Формат: "namespace:action:param"
// Пример: "menu:home", "issue:prefix:+666", "ban:confirm:12345"
export const CB = {
  // Общее
  MENU_HOME:              "menu:home",
  MENU_BACK:              "menu:back",
  MENU_CLOSE:             "menu:close",

  // ─── Admin-бот ───
  ADMIN_ISSUE:            "admin:issue",              // открыть меню выдачи номера
  ADMIN_ISSUE_PREFIX:     "admin:issue:prefix",       // "admin:issue:prefix:+666"
  ADMIN_ISSUE_RANDOM:     "admin:issue:random",       // сгенерировать случайный
  ADMIN_ISSUE_SEND:       "admin:issue:send",         // отправить юзеру
  ADMIN_ISSUE_AGAIN:      "admin:issue:again",        // сгенерировать другой

  ADMIN_BAN:              "admin:ban",
  ADMIN_UNBAN:            "admin:unban",
  ADMIN_VERIFY:           "admin:verify",
  ADMIN_UNVERIFY:         "admin:unverify",
  ADMIN_GRANT_GIFT:       "admin:gift",
  ADMIN_GRANT_STARS:      "admin:stars",
  ADMIN_BROADCAST:        "admin:broadcast",
  ADMIN_STATS:            "admin:stats",
  ADMIN_USERS_LIST:       "admin:users",
  ADMIN_LOGS:             "admin:logs",

  // ─── User-бот ───
  USER_WEB:               "user:web",                 // открыть веб-версию
  USER_GET_PHONE:         "user:get_phone",           // получить номер
  USER_PHONE_PREFIX:      "user:phone:prefix",        // "user:phone:prefix:+666"
  USER_PHONE_REGENERATE:  "user:phone:regen",         // перегенерировать
  USER_STARS:             "user:stars",               // мои звёзды
  USER_STARS_BUY:         "user:stars:buy",           // купить
  USER_STARS_PACK:        "user:stars:pack",          // "user:stars:pack:100"
  USER_GIFTS:             "user:gifts",               // мои подарки
  USER_GIFTS_SHOP:        "user:gifts:shop",          // магазин подарков
  USER_GIFTS_BUY:         "user:gifts:buy",           // "user:gifts:buy:pepe"
  USER_PROFILE:           "user:profile",
  USER_HELP:              "user:help",
};

// ═══════════════════════════════════════════
// РОЛИ И СТАТУСЫ
// ═══════════════════════════════════════════
export const ROLE = {
  USER:  "user",
  ADMIN: "admin",
};

export const BAN_REASONS = [
  { id: "spam",     label: "Спам",       emoji: "📢" },
  { id: "abuse",    label: "Оскорбления", emoji: "🤬" },
  { id: "scam",     label: "Скам",       emoji: "💸" },
  { id: "ads",      label: "Реклама",    emoji: "📣" },
  { id: "other",    label: "Другое",     emoji: "❓" },
];

// ═══════════════════════════════════════════
// ЯЗЫКИ (для настроек в вебе)
// ═══════════════════════════════════════════
export const LANGUAGES = [
  { code: "ru", label: "Русский",    flag: "🇷🇺" },
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
];

// ═══════════════════════════════════════════
// ТЕМЫ ОФОРМЛЕНИЯ
// ═══════════════════════════════════════════
export const THEMES = [
  { id: "system", label: "Системная" },
  { id: "light",  label: "Светлая" },
  { id: "dark",   label: "Тёмная" },
];
