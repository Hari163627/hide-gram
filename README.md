# Hide Gram

Веб-клон Telegram с NFT-подарками, звёздами и двумя Telegram-ботами
(Admin для управления, User для регистрации и покупок).

## Стек

- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide React
- **Backend:** Express + Prisma + Socket.IO
- **Database:** PostgreSQL (Supabase)
- **Bots:** grammY (Admin + User, оба на inline-кнопках)
- **Hosting:** Render (Free) + Supabase

## Структура

hide-gram/
├── client/ # React SPA
├── server/ # Express + Prisma + боты
└── shared/ # Общие константы (подарки, префиксы)

## Локальная разработка

1. Клонируй репо
2. `npm install` в корне (установит всё через workspaces)
3. Создай `server/.env` и `client/.env.local` по шаблонам `.env.example`
4. `npm run prisma:migrate` — применить миграции
5. `npm run dev` — запустить фронт и бэк одновременно

## Деплой

1. Push в GitHub
2. Render → New → Blueprint → выбрать репо
3. Заполнить секреты в Dashboard
4. Готово

## Лицензия

Private project. © Hide Gram 2025
