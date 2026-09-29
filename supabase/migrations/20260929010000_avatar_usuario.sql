-- Foto de perfil: cada usuário pode enviar, trocar e apagar arquivos só na
-- própria pasta do bucket "midia" (avatars/<id do usuário>/...).
-- A coluna profiles.avatar_url já existe no schema inicial.
create policy "avatar do proprio usuario insere" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'midia' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "avatar do proprio usuario atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'midia' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "avatar do proprio usuario apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'midia' and (storage.foldername(name))[1] = 'avatars' and (storage.foldername(name))[2] = auth.uid()::text);
