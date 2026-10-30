-- Permite reintentar subidas idempotentes al bucket privado de evidencias.
-- El backend usa upsert: true con una ruta estable para que un reintento no
-- duplique el objeto. Storage exige SELECT, INSERT y UPDATE para ese upsert.
-- La política limita la actualización a objetos del bucket evidencias dentro
-- de la carpeta del usuario autenticado.

drop policy if exists evidencias_storage_update on storage.objects;
create policy evidencias_storage_update
on storage.objects for update to authenticated
using (
  bucket_id = 'evidencias'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'evidencias'
  and (storage.foldername(name))[1] = auth.uid()::text
);
