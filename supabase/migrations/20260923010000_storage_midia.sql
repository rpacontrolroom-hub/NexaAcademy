-- Bucket público para arquivos da plataforma (imagens de módulos, capas,
-- modelos de certificado, materiais). Leitura pública; escrita só admin.
insert into storage.buckets (id, name, public)
values ('midia', 'midia', true)
on conflict (id) do nothing;

create policy "midia leitura publica" on storage.objects
  for select using (bucket_id = 'midia');

create policy "midia admin insere" on storage.objects
  for insert to authenticated with check (bucket_id = 'midia' and public.is_admin());

create policy "midia admin atualiza" on storage.objects
  for update to authenticated using (bucket_id = 'midia' and public.is_admin());

create policy "midia admin apaga" on storage.objects
  for delete to authenticated using (bucket_id = 'midia' and public.is_admin());
