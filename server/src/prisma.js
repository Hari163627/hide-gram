// server/src/prisma.js
// Единственный экземпляр Prisma Client.
// В dev при hot-reload — переиспользуем, чтобы не плодить соединения.

import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDev ? ['warn', 'error'] : ['error'],
  });

if (config.isDev) {
  globalForPrisma.prisma = prisma;
}

// Проверка соединения при старте
export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL: соединение установлено');
  } catch (err) {
    console.error('❌ PostgreSQL: не удалось подключиться');
    console.error(err);
    process.exit(1);
  }
}
