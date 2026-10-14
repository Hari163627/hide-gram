// server/src/supabase.js
// Клиент Supabase с секретным ключом (только серверная сторона!).
// Используется для: Storage (медиа), Admin API (управление юзерами).

import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SECRET_KEY,       // ← СЕКРЕТНЫЙ ключ, только на сервере
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Хелпер: загрузить файл в Storage
// bucket: 'avatars' | 'media' | 'gifts'
export async function uploadFile(bucket, path, fileBuffer, contentType) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  // Публичная ссылка
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
