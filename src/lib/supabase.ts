/*
  Клиент Supabase — единственная точка подключения к бэкенду.

  Ключи берём из переменных окружения (файл .env.local, в git не попадает).
  Здесь только публичный anon-ключ: он рассчитан на браузер, а доступ к данным
  ограничивает RLS (Row Level Security) на стороне базы.
*/
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Понятная ошибка на случай, если забыли создать .env.local
  throw new Error(
    "Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Скопируйте .env.example в .env.local и заполните значения."
  );
}

export const supabase = createClient(url, anonKey);
