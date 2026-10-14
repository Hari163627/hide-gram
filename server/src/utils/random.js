// server/src/utils/random.js
// Генерация случайных данных: номера, коды, username.

import crypto from 'node:crypto';

// Случайный 6-значный код (для входа)
export function generateAuthCode() {
  return String(crypto.randomInt(100000, 999999));
}

// Случайный номер по префиксу
// Пример: prefix "+666" → "+666 12 345 67"
export function generatePhone(prefix) {
  const digits = Array.from({ length: 9 }, () => crypto.randomInt(0, 10)).join('');
  // Группируем как "XXX XXX XXX"
  const grouped = digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  return `${prefix} ${grouped}`;
}

// Случайный username из имени
// "John Smith" → "john_smith_a3f8"
export function generateUsername(displayName) {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 20);
  const suffix = crypto.randomBytes(2).toString('hex');
  return `${base}_${suffix}`;
}

// Случайный nftId
export function generateNftId(typeId, serial) {
  const clean = typeId.replace(/[^a-z0-9]/gi, '_');
  return `hg_${clean}_${String(serial).padStart(4, '0')}`;
}
