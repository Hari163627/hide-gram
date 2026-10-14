// server/src/utils/jwt.js
// Подпись и проверка JWT-токенов сессии.

import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Время жизни токена
const SESSION_TTL = '30d';

// Создать токен
export function signSession(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: SESSION_TTL,
  });
}

// Проверить токен — вернёт payload или null
export function verifySession(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    return null;
  }
}
