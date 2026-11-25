-- Endurecimento de segurança (revisão de 25/11/2026). Pode rodar mais de uma vez.

-- 1) trocar_senha deixa de poder ser desligado pelo próprio usuário.
--    A troca passa a ser concluída pela função concluir_troca_senha(), que só libera
--    se a senha do Auth foi mesmo alterada depois da redefinição feita pelo admin.
alter table public.profiles add column if not exists trocar_senha_em timestamptz;

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
       or new.email  is distinct from old.email
       or new.trocar_senha is distinct from old.trocar_senha
       or new.trocar_senha_em is distinct from old.trocar_senha_em then
      raise exception 'Perfil, status, e-mail e troca de senha só podem ser alterados por administrador';
    end if;
  end if;
  return new;
end $$;

create or replace function public.admin_definir_senha(p_user_id uuid, p_senha text, p_temporaria boolean default true)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem definir senhas.';
  end if;
  if coalesce(char_length(p_senha), 0) < 8 then
    raise exception 'A senha precisa ter no mínimo 8 caracteres.';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at         = now()
   where id = p_user_id;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  delete from auth.sessions where user_id = p_user_id;

  update public.profiles
     set trocar_senha = coalesce(p_temporaria, true),
         trocar_senha_em = case when coalesce(p_temporaria, true) then now() else null end
   where id = p_user_id;

  insert into public.logs_atividade (user_id, acao, entidade, entidade_id)
  values (auth.uid(), 'Senha redefinida pelo administrador', 'profiles', p_user_id);
end $$;

create or replace function public.concluir_troca_senha()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_em timestamptz;
  v_atualizado timestamptz;
begin
  if auth.uid() is null then raise exception 'Sessão expirada'; end if;
  select trocar_senha_em into v_em from profiles where id = auth.uid();
  select updated_at into v_atualizado from auth.users where id = auth.uid();
  if v_em is not null and (v_atualizado is null or v_atualizado <= v_em) then
    raise exception 'A senha ainda não foi alterada.';
  end if;
  perform set_config('nexa.sistema', '1', true);
  update profiles set trocar_senha = false, trocar_senha_em = null where id = auth.uid();
  perform set_config('nexa.sistema', '', true);
end $$;

revoke execute on function public.concluir_troca_senha() from public, anon;
grant execute on function public.concluir_troca_senha() to authenticated;

-- 2) Funções security definer: só usuário logado chama pelo app; a de cálculo é interna.
revoke execute on function public.calcular_aproveitamento(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.emitir_certificado(uuid) from public, anon;
grant  execute on function public.emitir_certificado(uuid) to authenticated;
revoke execute on function public.responder_quiz(uuid, jsonb) from public, anon;
grant  execute on function public.responder_quiz(uuid, jsonb) to authenticated;

-- 3) View das alternativas do quiz: só logado.
revoke all on public.vw_quiz_alternativas_publicas from anon, public;
grant select on public.vw_quiz_alternativas_publicas to authenticated;
