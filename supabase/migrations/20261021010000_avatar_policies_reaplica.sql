-- Reaplica as policies da foto de perfil (20260929010000_avatar_usuario.sql).
-- Sem elas o upload em avatars/<id do usuário>/ falha por RLS para quem não é
-- admin. Pode rodar mais de uma vez.
drop policy if exists "avatar do proprio usuario insere" on storage.objects;
drop policy if exists "avatar do proprio usuario atualiza" on storage.objects;
drop policy if exists "avatar do proprio usuario apaga" on storage.objects;

create policy "avatar do proprio usuario insere" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'midia' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "avatar do proprio usuario atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'midia' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "avatar do proprio usuario apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'midia' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);
