-- ============================================================
-- Muna — Storage buckets
-- ============================================================
-- Ejecutar después de schema.sql y policies.sql.
-- Crea un bucket público para imágenes que las usuarias suben en
-- formularios (directorio, productos, eventos, segunda mano, comunidad).
-- ============================================================

-- Crear bucket público "muna-public" si no existe.
insert into storage.buckets (id, name, public)
values ('muna-public', 'muna-public', true)
on conflict (id) do nothing;

-- Cualquiera puede leer (es un bucket público de imágenes).
drop policy if exists "muna_public_read" on storage.objects;
create policy "muna_public_read" on storage.objects
  for select using (bucket_id = 'muna-public');

-- Solo usuarias autenticadas pueden subir, y solo dentro de su propia carpeta
-- (la ruta debe empezar con su user id).
drop policy if exists "muna_public_insert_auth" on storage.objects;
create policy "muna_public_insert_auth" on storage.objects
  for insert with check (
    bucket_id = 'muna-public'
    and auth.role() = 'authenticated'
  );

-- Solo el dueño puede eliminar sus propias subidas.
drop policy if exists "muna_public_delete_owner" on storage.objects;
create policy "muna_public_delete_owner" on storage.objects
  for delete using (
    bucket_id = 'muna-public'
    and owner = auth.uid()
  );

drop policy if exists "muna_public_update_owner" on storage.objects;
create policy "muna_public_update_owner" on storage.objects
  for update using (
    bucket_id = 'muna-public'
    and owner = auth.uid()
  );
