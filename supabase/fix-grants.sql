-- ============================================================
-- Muna — Hotfix: restaurar GRANTS por defecto del esquema public
-- ============================================================
-- Supabase aplica grants automáticos cuando creas tablas desde el dashboard
-- o cuando el esquema public está intacto. Pero al hacer
--   drop schema public cascade;
--   create schema public;
-- esos defaults se pierden y las tablas nuevas no permiten acceso al rol
-- 'anon' (visitantes sin sesión) ni a 'authenticated' (usuarias con sesión).
--
-- Este script:
--   1) Da SELECT a anon sobre todas las tablas del esquema public.
--   2) Da CRUD completo a authenticated y a service_role.
--   3) Configura default privileges para que las tablas que crees en el
--      futuro hereden estos permisos automáticamente.
--   4) Hace lo mismo con sequences y functions.
--
-- Es seguro correrlo varias veces.
-- ============================================================

-- Acceso al schema
grant usage on schema public to anon, authenticated, service_role;

-- Tablas existentes
grant select on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- Tablas que se creen en el futuro (dentro de este schema, por este usuario)
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant all on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- Sequences (para columnas con generated default, etc.)
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;

-- Functions
grant execute on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- Refrescar el cache de PostgREST para que reconozca los cambios al instante
notify pgrst, 'reload schema';
