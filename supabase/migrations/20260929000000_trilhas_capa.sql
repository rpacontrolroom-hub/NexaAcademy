-- Capa (imagem) das trilhas, enviada pelo painel administrativo.
alter table public.trilhas add column if not exists capa_url text;
