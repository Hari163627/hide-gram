// server/src/config.js
// Загрузка и валидация переменных окружения.
// Если чего-то критичного нет — сервер падает сразу с понятной ошибкой.

import 'dotenv/config';
import { z } from 'zod';

// Схема валидации — все обязательные переменные
const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  SUPABASE_SECRET_KEY: z.string().min(20),

  // БД
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // Боты
  BOT_TOKEN_ADMIN: z.string().min(20),
  BOT_TOKEN_USER: z.string().min(20),
  ADMIN_TG_ID: z.string().min(5),

  // Сервер
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  CLIENT_URL: z.string().url(),
  PUBLIC_URL: z.string().url(),
});

// Парсим — если что-то не так, будет явная ошибка
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Ошибка в .env файле:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  isProd: parsed.data.NODE_ENV === 'production',
  isDev: parsed.data.NODE_ENV === 'development',
};
