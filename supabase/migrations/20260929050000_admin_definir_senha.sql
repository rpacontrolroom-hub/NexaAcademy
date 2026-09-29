-- Admin define a senha de um usuário pelo app (sem service_role no navegador).
-- Por padrão a senha é temporária: no próximo login o usuário precisa criar a dele.

create extension if not exists pgcrypto with schema extensions;

alter table public.profiles add column if not exists trocar_senha boolean not null default false;

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

  -- Derruba as sessões abertas: quem estava logado precisa entrar com a senha nova.
  delete from auth.sessions where user_id = p_user_id;

  update public.profiles set trocar_senha = coalesce(p_temporaria, true) where id = p_user_id;

  insert into public.logs_atividade (user_id, acao, entidade, entidade_id)
  values (auth.uid(), 'Senha redefinida pelo administrador', 'profiles', p_user_id);
end $$;

revoke execute on function public.admin_definir_senha(uuid, text, boolean) from public, anon;
grant execute on function public.admin_definir_senha(uuid, text, boolean) to authenticated;
