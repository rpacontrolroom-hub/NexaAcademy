-- Tela de conclusão do treinamento: avaliação do aluno (1 a 5 estrelas) e
-- últimas pessoas que concluíram.

create table if not exists public.treinamento_avaliacoes (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  treinamento_id  uuid not null references public.treinamentos(id) on delete cascade,
  nota            int  not null check (nota between 1 and 5),
  comentario      text check (char_length(comentario) <= 1000),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, treinamento_id)
);
drop trigger if exists trg_treinamento_avaliacoes_updated on public.treinamento_avaliacoes;
create trigger trg_treinamento_avaliacoes_updated before update on public.treinamento_avaliacoes
  for each row execute function public.set_updated_at();

alter table public.treinamento_avaliacoes enable row level security;

-- Todos leem (média e comentários); só avalia quem concluiu o treinamento.
drop policy if exists "leitura autenticada" on public.treinamento_avaliacoes;
create policy "leitura autenticada" on public.treinamento_avaliacoes
  for select to authenticated using (true);

drop policy if exists "concluinte avalia" on public.treinamento_avaliacoes;
create policy "concluinte avalia" on public.treinamento_avaliacoes
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.matriculas m
                 where m.user_id = auth.uid() and m.treinamento_id = treinamento_avaliacoes.treinamento_id and m.progresso = 100)
  );

drop policy if exists "dono altera" on public.treinamento_avaliacoes;
create policy "dono altera" on public.treinamento_avaliacoes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "dono ou admin exclui" on public.treinamento_avaliacoes;
create policy "dono ou admin exclui" on public.treinamento_avaliacoes
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- O RLS de matriculas só mostra as do próprio usuário; esta função expõe apenas
-- nome, foto e data de conclusão de quem terminou o treinamento.
create or replace function public.concluintes_recentes(p_treinamento_id uuid, p_limite int default 8)
returns table (user_id uuid, nome text, avatar_url text, concluido_em timestamptz, total bigint)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.nome, p.avatar_url, m.concluido_em, count(*) over () as total
    from matriculas m
    join profiles p on p.id = m.user_id
   where m.treinamento_id = p_treinamento_id
     and m.progresso = 100
     and m.concluido_em is not null
   order by m.concluido_em desc
   limit least(greatest(coalesce(p_limite, 8), 1), 50);
$$;

revoke all on function public.concluintes_recentes(uuid, int) from anon, public;
grant execute on function public.concluintes_recentes(uuid, int) to authenticated;
