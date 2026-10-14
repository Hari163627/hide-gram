// server/src/utils/asyncHandler.js
// Обёртка, чтобы async-роуты не крашили сервер при ошибках.
// Вместо try/catch в каждом роуте — просто оборачиваем функцией.

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
