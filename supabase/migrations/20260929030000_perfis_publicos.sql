-- Nome e foto dos usuários para exibir autores de comentários.
-- O RLS de profiles só libera o próprio perfil; esta view expõe apenas
-- id, nome e avatar_url (sem e-mail, cargo, perfil ou status).
create or replace view public.vw_perfis_publicos with (security_invoker = false) as
select id, nome, avatar_url from public.profiles;

revoke all on public.vw_perfis_publicos from anon, public;
grant select on public.vw_perfis_publicos to authenticated;
