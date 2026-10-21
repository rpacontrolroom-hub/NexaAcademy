-- Ao apagar um módulo/aula (ou o treinamento), o aula_progresso é apagado em
-- cascata e o trigger roda depois que a aula já sumiu: não acha o treinamento
-- e tentava gravar matrícula com treinamento_id nulo. Nesse caso não há o que
-- recalcular.
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

  if v_trein is null then
    return coalesce(new, old);
  end if;

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
