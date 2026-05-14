-- ============================================================
-- Muna — WIPE: borra todo el contenido previo del proyecto Supabase
-- ============================================================
-- Ejecutar ANTES de schema.sql cuando quieras empezar desde cero.
-- Esto NO borra:
--   - Las cuentas de auth.users (esas las borras a mano desde el
--     dashboard de Supabase → Authentication → Users si las quieres
--     limpias también).
--   - El proyecto en sí (sigue siendo el mismo: misma URL, misma
--     anon key).
-- ============================================================

-- 1) Quitar el trigger del esquema auth (porque apunta a una función
--    en public que vamos a borrar).
drop trigger if exists on_auth_user_created on auth.users;

-- 2) Borrar todo el esquema public y recrearlo vacío.
drop schema if exists public cascade;
create schema public;

-- 3) Restaurar permisos por defecto del esquema public.
grant all on schema public to postgres;
grant all on schema public to anon;
grant all on schema public to authenticated;
grant all on schema public to service_role;
grant usage on schema public to anon, authenticated, service_role;

-- 3b) Default privileges para que las tablas que crearemos a continuación
--     en schema.sql hereden grants para los roles públicos de Supabase.
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant all on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- 4) Limpiar políticas viejas del bucket de Storage (si las había).
drop policy if exists "muna_public_read" on storage.objects;
drop policy if exists "muna_public_insert_auth" on storage.objects;
drop policy if exists "muna_public_delete_owner" on storage.objects;
drop policy if exists "muna_public_update_owner" on storage.objects;

-- 5) (OPCIONAL) Vaciar archivos subidos previamente al bucket muna-public.
--    Descomenta SOLO si quieres borrar también las imágenes subidas
--    antes de hoy. Si nunca subiste nada, no hace falta.
-- delete from storage.objects where bucket_id = 'muna-public';
-- delete from storage.buckets where id = 'muna-public';
