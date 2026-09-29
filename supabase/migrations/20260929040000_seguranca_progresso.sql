-- =====================================================================
-- Segurança do progresso das aulas.
-- Antes, o aluno podia gravar aula_progresso/matriculas direto pela API e
-- concluir aulas (e ganhar certificado) sem assistir. Agora:
--  * o player informa ao servidor, periodicamente, quanto foi assistido;
--    o servidor aceita no máximo 2x o tempo real decorrido entre envios;
--  * aula de vídeo do YouTube só conclui com 90% assistido (concluir_aula);
--  * gravação direta em aula_progresso e matriculas fica bloqueada.
-- Também: log só por admin, limite e ritmo de comentários.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tempo assistido por aula (escrito só pelas funções abaixo)
-- ---------------------------------------------------------------------
create table if not exists public.aula_video_progresso (
  user_id              uuid not null references public.profiles(id) on delete cascade,
  aula_id              uuid not null references public.aulas(id) on delete cascade,
  segundos_assistidos  numeric not null default 0,
  duracao_informada    numeric,
  ultimo_envio         timestamptz,
  updated_at           timestamptz not null default now(),
  primary key (user_id, aula_id)
);

alter table public.aula_video_progresso enable row level security;
create policy "dono ou admin le" on public.aula_video_progresso for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Aula de vídeo do YouTube: é a que exige o tempo mínimo assistido.
create or replace function public.aula_exige_video(p_aula public.aulas)
returns boolean language sql immutable as $$
  select p_aula.tipo = 'video' and coalesce(p_aula.url, '') ~* '(youtube\.com|youtu\.be)';
$$;

-- Percentual assistido. A duração cadastrada na aula tem prioridade; sem ela,
-- vale a informada pelo player do próprio aluno.
create or replace function public.percentual_video(p_aula public.aulas, p_prog public.aula_video_progresso)
returns numeric language sql immutable as $$
  select case
    when coalesce(nullif(p_aula.duracao_segundos, 0), p_prog.duracao_informada, 0) <= 0 then 0
    else least(100, round(100.0 * p_prog.segundos_assistidos / coalesce(nullif(p_aula.duracao_segundos, 0), p_prog.duracao_informada), 1))
  end;
$$;

-- p_segundos: segundos novos assistidos desde o último envio. Devolve o % assistido.
create or replace function public.registrar_progresso_video(p_aula_id uuid, p_segundos numeric, p_duracao numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  v_uid       uuid := auth.uid();
  v_agora     timestamptz := clock_timestamp();
  v_aula      aulas;
  v_prog      aula_video_progresso;
  v_permitido numeric;
begin
  if v_uid is null then raise exception 'Sessão expirada'; end if;

  select * into v_aula from aulas where id = p_aula_id and status = 'publicado';
  if not found then raise exception 'Aula não encontrada'; end if;

  -- O player do admin grava a duração real do vídeo na aula (quando ainda não há).
  if public.is_admin() and coalesce(p_duracao, 0) > 0 and coalesce(v_aula.duracao_segundos, 0) = 0 then
    update aulas set duracao_segundos = round(p_duracao) where id = p_aula_id
    returning * into v_aula;
  end if;

  select * into v_prog from aula_video_progresso where user_id = v_uid and aula_id = p_aula_id for update;
  if not found then
    insert into aula_video_progresso (user_id, aula_id, segundos_assistidos, duracao_informada, ultimo_envio)
    values (v_uid, p_aula_id, 0, nullif(p_duracao, 0), v_agora)
    returning * into v_prog;
    return public.percentual_video(v_aula, v_prog);
  end if;

  -- Nunca mais que 2x o tempo real desde o último envio (velocidade máxima comum do player).
  v_permitido := least(
    greatest(coalesce(p_segundos, 0), 0),
    extract(epoch from (v_agora - coalesce(v_prog.ultimo_envio, v_agora))) * 2 + 2,
    300
  );

  update aula_video_progresso
     set segundos_assistidos = segundos_assistidos + v_permitido,
         duracao_informada   = coalesce(nullif(p_duracao, 0), duracao_informada),
         ultimo_envio        = v_agora,
         updated_at          = v_agora
   where user_id = v_uid and aula_id = p_aula_id
  returning * into v_prog;

  return public.percentual_video(v_aula, v_prog);
end $$;

-- Abrir a aula registra a matrícula (antes era um upsert direto do navegador).
create or replace function public.registrar_aula_aberta(p_aula_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sessão expirada'; end if;
  if not exists (select 1 from aulas where id = p_aula_id and status = 'publicado') then
    raise exception 'Aula não encontrada';
  end if;
  insert into aula_progresso (user_id, aula_id) values (auth.uid(), p_aula_id)
  on conflict (user_id, aula_id) do nothing;
end $$;

-- Única forma de concluir uma aula.
create or replace function public.concluir_aula(p_aula_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_aula aulas;
  v_prog aula_video_progresso;
begin
  if auth.uid() is null then raise exception 'Sessão expirada'; end if;

  select * into v_aula from aulas where id = p_aula_id and status = 'publicado';
  if not found then raise exception 'Aula não encontrada'; end if;

  if public.aula_exige_video(v_aula) then
    select * into v_prog from aula_video_progresso where user_id = auth.uid() and aula_id = p_aula_id;
    if not found or public.percentual_video(v_aula, v_prog) < 90 then
      raise exception 'Assista pelo menos 90%% do vídeo para concluir a aula.';
    end if;
  end if;

  insert into aula_progresso (user_id, aula_id, concluida, concluida_em)
  values (auth.uid(), p_aula_id, true, now())
  on conflict (user_id, aula_id) do update
    set concluida = true,
        concluida_em = coalesce(aula_progresso.concluida_em, now());
end $$;

revoke execute on function public.registrar_progresso_video(uuid, numeric, numeric) from public, anon;
revoke execute on function public.registrar_aula_aberta(uuid) from public, anon;
revoke execute on function public.concluir_aula(uuid) from public, anon;
grant execute on function public.registrar_progresso_video(uuid, numeric, numeric) to authenticated;
grant execute on function public.registrar_aula_aberta(uuid) to authenticated;
grant execute on function public.concluir_aula(uuid) to authenticated;

-- Progresso e matrícula passam a ser escritos só pelas funções (security definer) e triggers.
drop policy if exists "dono escreve" on public.aula_progresso;
drop policy if exists "dono escreve" on public.matriculas;

-- ---------------------------------------------------------------------
-- Log de atividades: só admin grava pelo app (os registros de aluno vêm das funções).
-- ---------------------------------------------------------------------
drop policy if exists "usuario registra" on public.logs_atividade;
create policy "admin registra" on public.logs_atividade for insert to authenticated
  with check (public.is_admin() and user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Comentários: tamanho e ritmo (no máximo 5 por minuto por pessoa).
-- ---------------------------------------------------------------------
alter table public.aula_comentarios
  add constraint aula_comentarios_tamanho check (char_length(btrim(conteudo)) between 1 and 2000) not valid;

create or replace function public.limitar_comentarios()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from aula_comentarios
       where user_id = new.user_id and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'Muitos comentários em pouco tempo. Aguarde um minuto.';
  end if;
  return new;
end $$;

drop trigger if exists trg_limitar_comentarios on public.aula_comentarios;
create trigger trg_limitar_comentarios before insert on public.aula_comentarios
  for each row execute function public.limitar_comentarios();
