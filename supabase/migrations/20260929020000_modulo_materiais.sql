-- Materiais de apoio do módulo (PDF, Word, Excel...). Aparecem em todas as aulas do módulo.
create table if not exists public.modulo_materiais (
  id             uuid primary key default gen_random_uuid(),
  modulo_id      uuid not null references public.modulos(id) on delete cascade,
  titulo         text not null,
  arquivo_url    text,
  tamanho_bytes  bigint,
  ordem          int not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists modulo_materiais_modulo_idx on public.modulo_materiais (modulo_id);

-- Mesmo padrão do catálogo: qualquer usuário logado lê, só admin escreve.
alter table public.modulo_materiais enable row level security;
create policy "leitura autenticada" on public.modulo_materiais for select to authenticated using (true);
create policy "admin escreve" on public.modulo_materiais for all to authenticated using (public.is_admin()) with check (public.is_admin());
