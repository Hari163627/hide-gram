// server/src/index.js
// Точка входа: Express + Socket.IO + оба Telegram-бота.
// В dev — боты работают в режиме polling.
// В prod (Render) — боты работают в режиме webhook.

import express from 'express';
import http from 'node:http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as SocketServer } from 'socket.io';

import { config } from './config.js';
import { connectDB, prisma } from './prisma.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Боты — импортируем функции запуска
import { startAdminBot } from './bots/admin/index.js';
import { startUserBot } from './bots/user/index.js';
import { setupSocket } from './socket.js';

// ═══════════════════════════════════════════
// 1. Express
// ═══════════════════════════════════════════
const app = express();

// ─── Middleware ───
app.set('trust proxy', 1);  // важно для Render (реальный IP за прокси)

app.use(cors({
  origin: [config.CLIENT_URL, 'http://localhost:5173'],
  credentials: true,  // разрешаем cookie
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Роуты ───
app.use('/', healthRouter);
app.use('/auth', authRouter);

// ─── Обработка ошибок ───
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════════════════
// 2. HTTP-сервер + Socket.IO
// ═══════════════════════════════════════════
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: [config.CLIENT_URL, 'http://localhost:5173'],
    credentials: true,
  },
  path: '/socket.io',
});

setupSocket(io);

// ═══════════════════════════════════════════
// 3. Запуск
// ═══════════════════════════════════════════
async function start() {
  console.log('');
  console.log('🚀 Запуск Hide Gram...');
  console.log(`   Среда: ${config.NODE_ENV}`);
  console.log(`   Порт: ${config.PORT}`);
  console.log('');

  // 1. Подключаемся к БД
  await connectDB();

  // 2. Запускаем оба бота
  await startAdminBot();
  await startUserBot();

  // 3. Стартуем HTTP-сервер
  server.listen(config.PORT, '0.0.0.0', () => {
    console.log('');
    console.log(`✅ Сервер запущен: http://localhost:${config.PORT}`);
    console.log(`   Health: http://localhost:${config.PORT}/health`);
    console.log('');
  });
}

// ─── Graceful shutdown (корректное завершение) ───
async function shutdown(signal) {
  console.log(`\n${signal} получен. Завершаем работу...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Соединение с БД закрыто.');
    process.exit(0);
  });
  // Принудительный выход через 10 сек, если что-то зависло
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Ловим необработанные ошибки ───
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

// Погнали
start().catch((err) => {
  console.error('❌ Ошибка при запуске:', err);
  process.exit(1);
});
