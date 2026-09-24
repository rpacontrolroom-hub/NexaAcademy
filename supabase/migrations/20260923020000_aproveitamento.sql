-- =====================================================================
-- Aproveitamento (nota) do aluno.
-- Antes, nenhum fluxo conseguia gravar matriculas.aproveitamento e o
-- certificado nunca podia ser emitido. Agora:
--  * treinamento SEM quiz publicado: ao concluir 100%, aproveitamento = 100;
--  * treinamento COM quiz: a nota vem de responder_quiz(), corrigido no
--    servidor (o aluno não grava a própria nota nem a tentativa).
-- Funções internas marcam "nexa.sistema" para passar pelo proteger_campos.
-- =====================================================================

create or replace function public.proteger_campos()
returns trigger language plpgsql as $$
begin
  if public.is_admin() or auth.uid() is null or current_setting('nexa.sistema', true) = '1' then
    return new;
  end if;
  if tg_table_name = 'matriculas' then
    if (tg_op = 'INSERT' and new.aproveitamento is not null)
       or (tg_op = 'UPDATE' and new.aproveitamento is distinct from old.aproveitamento) then
      raise exception 'Aproveitamento não pode ser alterado pelo usuário';
    end if;
  elsif tg_table_name = 'profiles' then
    if new.perfil is distinct from old.perfil
       or new.status is distinct from old.status
       or new.email  is distinct from old.email then
      raise exception 'Perfil, status e e-mail só podem ser alterados por administrador';
    end if;
  end if;
  return new;
end $$;

-- Maior nota entre os quizzes publicados do treinamento; 100 se não houver quiz.
create or replace function public.calcular_aproveitamento(p_user uuid, p_treinamento uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select case
    when not exists (
      select 1 from quizzes q
      left join aulas a on a.id = q.aula_id
      left join modulos m on m.id = a.modulo_id
      where q.status = 'publicado' and (q.treinamento_id = p_treinamento or m.treinamento_id = p_treinamento)
    ) then 100
    else (
      select max(t.nota) from quiz_tentativas t
      join quizzes q on q.id = t.quiz_id
      left join aulas a on a.id = q.aula_id
      left join modulos m on m.id = a.modulo_id
      where t.user_id = p_user and q.status = 'publicado'
        and (q.treinamento_id = p_treinamento or m.treinamento_id = p_treinamento)
    )
  end;
$$;

create or replace function public.recalcular_progresso()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_aula uuid := coalesce(new.aula_id, old.aula_id);
  v_trein uuid;
  v_total int;
  v_feitas int;
  v_prog numeric;
begin
  if tg_op = 'UPDATE' and new.concluida is not distinct from old.concluida then
    return new;
  end if;

  select m.treinamento_id into v_trein
  from aulas a join modulos m on m.id = a.modulo_id where a.id = v_aula;

  select count(*), count(*) filter (where ap.concluida)
    into v_total, v_feitas
  from aulas a
  join modulos m on m.id = a.modulo_id
  left join aula_progresso ap on ap.aula_id = a.id and ap.user_id = v_user
  where m.treinamento_id = v_trein and a.status = 'publicado';

  v_prog := case when v_total = 0 then 0 else round(100.0 * v_feitas / v_total, 2) end;

  perform set_config('nexa.sistema', '1', true);
  insert into matriculas (user_id, treinamento_id, progresso, ultima_aula_id, aproveitamento)
  values (v_user, v_trein, v_prog, v_aula,
          case when v_prog = 100 then calcular_aproveitamento(v_user, v_trein) end)
  on conflict (user_id, treinamento_id) do update
    set progresso      = excluded.progresso,
        ultima_aula_id = excluded.ultima_aula_id,
        concluido_em   = case when excluded.progresso = 100 then coalesce(matriculas.concluido_em, now()) else null end,
        aproveitamento = case when excluded.progresso = 100 then calcular_aproveitamento(v_user, v_trein) else matriculas.aproveitamento end;
  perform set_config('nexa.sistema', '', true);
  return coalesce(new, old);
end $$;

-- Tentativas só pela função de correção.
drop policy if exists "dono escreve" on public.quiz_tentativas;

-- Corrige o quiz no servidor. p_respostas = { "<pergunta_id>": "<alternativa_id>", ... }
create or replace function public.responder_quiz(p_quiz_id uuid, p_respostas jsonb)
returns public.quiz_tentativas
language plpgsql security definer set search_path = public as $$
declare
  v_quiz    quizzes;
  v_total   int;
  v_certas  int;
  v_nota    numeric;
  v_tent    quiz_tentativas;
  v_trein   uuid;
  v_usadas  int;
begin
  if auth.uid() is null then raise exception 'Sessão expirada'; end if;

  select * into v_quiz from quizzes where id = p_quiz_id and status = 'publicado';
  if not found then raise exception 'Quiz não encontrado'; end if;

  if v_quiz.max_tentativas is not null then
    select count(*) into v_usadas from quiz_tentativas where quiz_id = p_quiz_id and user_id = auth.uid();
    if v_usadas >= v_quiz.max_tentativas then raise exception 'Limite de tentativas atingido'; end if;
  end if;

  select count(*) into v_total from quiz_perguntas where quiz_id = p_quiz_id;
  if v_total = 0 then raise exception 'Quiz sem perguntas'; end if;

  select count(*) into v_certas
  from quiz_perguntas p
  join quiz_alternativas a on a.pergunta_id = p.id and a.correta
  where p.quiz_id = p_quiz_id and (p_respostas ->> p.id::text) = a.id::text;

  v_nota := round(100.0 * v_certas / v_total, 2);

  insert into quiz_tentativas (quiz_id, user_id, nota, aprovado, respostas)
  values (p_quiz_id, auth.uid(), v_nota, v_nota >= v_quiz.nota_minima, p_respostas)
  returning * into v_tent;

  -- Atualiza o aproveitamento da matrícula (se já concluída).
  v_trein := coalesce(v_quiz.treinamento_id,
                      (select m.treinamento_id from aulas a join modulos m on m.id = a.modulo_id where a.id = v_quiz.aula_id));
  perform set_config('nexa.sistema', '1', true);
  update matriculas
     set aproveitamento = calcular_aproveitamento(auth.uid(), v_trein)
   where user_id = auth.uid() and treinamento_id = v_trein and progresso = 100;
  perform set_config('nexa.sistema', '', true);

  insert into logs_atividade (user_id, acao, entidade, entidade_id)
  values (auth.uid(),
          case when v_tent.aprovado then 'Quiz aprovado' else 'Quiz reprovado' end || ' — ' || v_quiz.titulo || ' (' || v_nota || '%)',
          'quiz_tentativas', v_tent.id);

  return v_tent;
end $$;

-- Recalcula matrículas já concluídas (sem nota até agora).
select set_config('nexa.sistema', '1', true);
update public.matriculas
   set aproveitamento = public.calcular_aproveitamento(user_id, treinamento_id)
 where progresso = 100 and aproveitamento is null;
