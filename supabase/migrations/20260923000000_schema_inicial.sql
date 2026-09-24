-- =====================================================================
-- Nexa Academy — schema inicial
-- Substitui os dados mocados de src/mocks e src/views/academy por tabelas.
-- Executar no Supabase: SQL Editor > New query > colar e rodar.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type perfil_usuario       as enum ('usuario', 'administrador');
create type status_ativo         as enum ('ativo', 'inativo');
create type nivel_treinamento    as enum ('Básico', 'Intermediário', 'Avançado', 'Iniciante');
create type tipo_aula            as enum ('video', 'texto', 'doc', 'quiz', 'aula');
create type status_publicacao    as enum ('publicado', 'rascunho');
create type status_modelo_cert   as enum ('active', 'draft');
create type papel_mensagem       as enum ('usuario', 'assistente');

-- ---------------------------------------------------------------------
-- Funções utilitárias
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Configurações gerais (admin-config)
-- ---------------------------------------------------------------------
create table public.configuracoes (
  chave       text primary key,
  valor       jsonb not null,
  descricao   text,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Usuários (adminUsers, perfil)
-- Um registro por usuário do Supabase Auth.
-- ---------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  nome           text not null,
  email          text not null unique,
  cargo          text,
  avatar_url     text,
  perfil         perfil_usuario not null default 'usuario',
  status         status_ativo   not null default 'ativo',
  ultimo_acesso  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Precisa existir antes das policies. security definer evita recursão de RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and perfil = 'administrador' and status = 'ativo'
  );
$$;

-- Cria o profile automaticamente no cadastro e aplica a regra de domínio corporativo.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  dominio text;
begin
  select valor #>> '{}' into dominio from public.configuracoes where chave = 'dominio_corporativo';
  if dominio is not null and lower(new.email) not like '%' || lower(dominio) then
    raise exception 'Somente e-mails % podem ser cadastrados', dominio;
  end if;

  insert into public.profiles (id, nome, email, cargo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'cargo'
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Catálogo: categorias, treinamentos, módulos, aulas
-- ---------------------------------------------------------------------
create table public.categorias (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.treinamentos (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  titulo            text not null,
  descricao         text,
  categoria_id      uuid references public.categorias(id) on delete set null,
  nivel             nivel_treinamento not null default 'Básico',
  duracao_minutos   int not null default 0 check (duracao_minutos >= 0),
  capa_url          text,
  icone             text,                       -- nome do ícone lucide (ex.: "Workflow")
  gradiente_inicio  text,                       -- hex
  gradiente_fim     text,                       -- hex
  status            status_ativo not null default 'ativo',
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on public.treinamentos (categoria_id);
create trigger trg_treinamentos_updated before update on public.treinamentos
  for each row execute function public.set_updated_at();

create table public.modulos (
  id              uuid primary key default gen_random_uuid(),
  treinamento_id  uuid not null references public.treinamentos(id) on delete cascade,
  ordem           int  not null,
  titulo          text not null,
  descricao       text,
  imagem_url      text,
  created_at      timestamptz not null default now(),
  unique (treinamento_id, ordem)
);

create table public.aulas (
  id                uuid primary key default gen_random_uuid(),
  modulo_id         uuid not null references public.modulos(id) on delete cascade,
  ordem             int  not null,
  codigo            text,                       -- ex.: "3.4"
  titulo            text not null,
  tipo              tipo_aula not null default 'video',
  duracao_segundos  int not null default 0 check (duracao_segundos >= 0),
  url               text,                       -- vídeo, documento ou link
  conteudo          text,                       -- markdown (tipo texto)
  descricao         text,
  resumo            text,
  objetivos         text[] not null default '{}',
  aprendizados      text[] not null default '{}',
  transcricao       text,
  status            status_publicacao not null default 'publicado',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (modulo_id, ordem)
);
create trigger trg_aulas_updated before update on public.aulas
  for each row execute function public.set_updated_at();

create table public.aula_materiais (
  id             uuid primary key default gen_random_uuid(),
  aula_id        uuid not null references public.aulas(id) on delete cascade,
  titulo         text not null,
  arquivo_url    text,
  tamanho_bytes  bigint,
  ordem          int not null default 0,
  created_at     timestamptz not null default now()
);

-- Vídeos (admin-videos). Pode estar ligado a uma aula ou solto no treinamento.
create table public.videos (
  id                uuid primary key default gen_random_uuid(),
  titulo            text not null,
  youtube_url       text,
  treinamento_id    uuid references public.treinamentos(id) on delete cascade,
  aula_id           uuid references public.aulas(id) on delete set null,
  duracao_segundos  int not null default 0,
  status            status_publicacao not null default 'rascunho',
  visualizacoes     int not null default 0,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_videos_updated before update on public.videos
  for each row execute function public.set_updated_at();

-- Documentos da base de conhecimento (docs / admin-docs)
create table public.documentos (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  descricao       text,
  categoria_id    uuid references public.categorias(id) on delete set null,
  treinamento_id  uuid references public.treinamentos(id) on delete set null,
  arquivo_url     text not null,
  tamanho_bytes   bigint,
  status          status_publicacao not null default 'publicado',
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_documentos_updated before update on public.documentos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Quizzes (admin-quizzes)
-- ---------------------------------------------------------------------
create table public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  treinamento_id  uuid references public.treinamentos(id) on delete cascade,
  aula_id         uuid references public.aulas(id) on delete cascade,
  titulo          text not null,
  nota_minima     numeric(5,2) not null default 90,
  max_tentativas  int,
  status          status_publicacao not null default 'rascunho',
  created_at      timestamptz not null default now()
);

create table public.quiz_perguntas (
  id         uuid primary key default gen_random_uuid(),
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  ordem      int  not null,
  enunciado  text not null,
  unique (quiz_id, ordem)
);

create table public.quiz_alternativas (
  id           uuid primary key default gen_random_uuid(),
  pergunta_id  uuid not null references public.quiz_perguntas(id) on delete cascade,
  ordem        int  not null,
  texto        text not null,
  correta      boolean not null default false
);

create table public.quiz_tentativas (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  nota         numeric(5,2) not null,
  aprovado     boolean not null,
  respostas    jsonb not null default '{}',     -- { pergunta_id: alternativa_id }
  realizado_em timestamptz not null default now()
);
create index on public.quiz_tentativas (user_id, quiz_id);

-- ---------------------------------------------------------------------
-- Trilhas (trilhas / admin-trilhas)
-- ---------------------------------------------------------------------
create table public.trilhas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null unique,
  descricao   text,
  cor         text,                             -- hex ou token do tema
  status      status_ativo not null default 'ativo',
  created_at  timestamptz not null default now()
);

create table public.trilha_etapas (
  id              uuid primary key default gen_random_uuid(),
  trilha_id       uuid not null references public.trilhas(id) on delete cascade,
  ordem           int  not null,
  titulo          text not null,
  treinamento_id  uuid references public.treinamentos(id) on delete set null,
  unique (trilha_id, ordem)
);

-- ---------------------------------------------------------------------
-- Progresso do usuário
-- ---------------------------------------------------------------------
-- Matrícula do usuário no treinamento (progress, aproveitamento de courses/meusTreinamentos)
create table public.matriculas (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  treinamento_id  uuid not null references public.treinamentos(id) on delete cascade,
  progresso       numeric(5,2) not null default 0 check (progresso between 0 and 100),
  aproveitamento  numeric(5,2) check (aproveitamento between 0 and 100),
  ultima_aula_id  uuid references public.aulas(id) on delete set null,
  iniciado_em     timestamptz not null default now(),
  concluido_em    timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, treinamento_id)
);
create trigger trg_matriculas_updated before update on public.matriculas
  for each row execute function public.set_updated_at();

create table public.aula_progresso (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  aula_id          uuid not null references public.aulas(id) on delete cascade,
  concluida        boolean not null default false,
  posicao_segundos int not null default 0,
  concluida_em     timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, aula_id)
);
create trigger trg_aula_progresso_updated before update on public.aula_progresso
  for each row execute function public.set_updated_at();

create table public.favoritos (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  treinamento_id  uuid not null references public.treinamentos(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, treinamento_id)
);

-- Recalcula matriculas.progresso quando uma aula é concluída/desmarcada.
create or replace function public.recalcular_progresso()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := coalesce(new.user_id, old.user_id);
  v_aula uuid := coalesce(new.aula_id, old.aula_id);
  v_trein uuid;
  v_total int;
  v_feitas int;
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

  insert into matriculas (user_id, treinamento_id, progresso, ultima_aula_id)
  values (v_user, v_trein, case when v_total = 0 then 0 else round(100.0 * v_feitas / v_total, 2) end, v_aula)
  on conflict (user_id, treinamento_id) do update
    set progresso      = excluded.progresso,
        ultima_aula_id = excluded.ultima_aula_id,
        concluido_em   = case when excluded.progresso = 100 then coalesce(matriculas.concluido_em, now()) else null end;
  return coalesce(new, old);
end $$;

create trigger trg_aula_progresso_recalc
  after insert or update or delete on public.aula_progresso
  for each row execute function public.recalcular_progresso();

-- ---------------------------------------------------------------------
-- Certificados
-- ---------------------------------------------------------------------
create table public.certificado_modelos (
  id                     uuid primary key default gen_random_uuid(),
  treinamento_id         uuid not null references public.treinamentos(id) on delete cascade,
  nome                   text not null,
  tipo_label             text not null default 'DE CONCLUSÃO',
  cor_destaque           text not null default '#0B5275',
  nota_minima            numeric(5,2) not null default 90 check (nota_minima between 0 and 100),
  assinante_nome         text not null,
  assinante_cargo        text not null,
  conteudo_programatico  text[] not null default '{}',
  arquivo_nome           text,
  arquivo_url            text,
  status                 status_modelo_cert not null default 'draft',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
-- Regra do app: apenas um modelo ativo por treinamento.
create unique index certificado_modelos_um_ativo
  on public.certificado_modelos (treinamento_id) where status = 'active';
create trigger trg_cert_modelos_updated before update on public.certificado_modelos
  for each row execute function public.set_updated_at();

-- Ao ativar um modelo, os demais do mesmo treinamento viram rascunho.
create or replace function public.desativar_outros_modelos()
returns trigger language plpgsql as $$
begin
  if new.status = 'active' then
    update public.certificado_modelos
       set status = 'draft'
     where treinamento_id = new.treinamento_id and id <> new.id and status = 'active';
  end if;
  return new;
end $$;
create trigger trg_cert_modelos_unico_ativo
  before insert or update of status on public.certificado_modelos
  for each row execute function public.desativar_outros_modelos();

create sequence public.certificado_codigo_seq;

create table public.certificados (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,          -- NXA-YYYY-NNNNN
  user_id         uuid not null references public.profiles(id) on delete cascade,
  treinamento_id  uuid not null references public.treinamentos(id) on delete restrict,
  modelo_id       uuid references public.certificado_modelos(id) on delete set null,
  aproveitamento  numeric(5,2) not null,
  emitido_em      timestamptz not null default now(),
  unique (user_id, treinamento_id)
);

-- Emite o certificado do usuário logado validando progresso 100% e nota mínima.
create or replace function public.emitir_certificado(p_treinamento_id uuid)
returns public.certificados
language plpgsql security definer set search_path = public as $$
declare
  v_mat    matriculas;
  v_modelo certificado_modelos;
  v_min    numeric;
  v_cert   certificados;
begin
  select * into v_cert from certificados
   where user_id = auth.uid() and treinamento_id = p_treinamento_id;
  if found then return v_cert; end if;

  select * into v_mat from matriculas
   where user_id = auth.uid() and treinamento_id = p_treinamento_id;
  if not found or v_mat.progresso < 100 then
    raise exception 'Treinamento não concluído';
  end if;

  select * into v_modelo from certificado_modelos
   where treinamento_id = p_treinamento_id and status = 'active';
  v_min := coalesce(v_modelo.nota_minima,
                    (select (valor #>> '{}')::numeric from configuracoes where chave = 'nota_minima_certificado'),
                    90);
  if coalesce(v_mat.aproveitamento, 0) < v_min then
    raise exception 'Aproveitamento mínimo de % não atingido', v_min;
  end if;

  insert into certificados (codigo, user_id, treinamento_id, modelo_id, aproveitamento)
  values (
    'NXA-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('certificado_codigo_seq')::text, 5, '0'),
    auth.uid(), p_treinamento_id, v_modelo.id, v_mat.aproveitamento
  )
  returning * into v_cert;

  insert into logs_atividade (user_id, acao, entidade, entidade_id)
  values (auth.uid(), 'Certificado emitido', 'certificados', v_cert.id);

  return v_cert;
end $$;

-- ---------------------------------------------------------------------
-- Notificações, chat Nexa, discussão, logs
-- ---------------------------------------------------------------------
create table public.notificacoes (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  mensagem        text not null,
  link            text,
  destinatario_id uuid references public.profiles(id) on delete cascade,  -- null = todos
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create table public.notificacao_leituras (
  notificacao_id  uuid not null references public.notificacoes(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  lida_em         timestamptz not null default now(),
  primary key (notificacao_id, user_id)
);

-- Chat "Nexa Feedbacks"
create table public.nexa_mensagens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  papel       papel_mensagem not null,
  conteudo    text not null,
  created_at  timestamptz not null default now()
);
create index on public.nexa_mensagens (user_id, created_at);

-- Aba "Discussão" da aula
create table public.aula_comentarios (
  id          uuid primary key default gen_random_uuid(),
  aula_id     uuid not null references public.aulas(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.aula_comentarios(id) on delete cascade,
  conteudo    text not null,
  created_at  timestamptz not null default now()
);

-- adminLogs
create table public.logs_atividade (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  acao         text not null,
  entidade     text,
  entidade_id  uuid,
  detalhes     jsonb,
  created_at   timestamptz not null default now()
);
create index on public.logs_atividade (created_at desc);

-- ---------------------------------------------------------------------
-- Views do dashboard (substituem topCourses, monthlyHours e cards fixos)
-- security_invoker = respeita o RLS de quem consulta.
-- ---------------------------------------------------------------------
create view public.vw_treinamentos_mais_acessados with (security_invoker = true) as
select t.id, t.titulo as name, count(m.user_id)::int as acessos
from treinamentos t
left join matriculas m on m.treinamento_id = t.id
group by t.id, t.titulo
order by acessos desc;

create view public.vw_horas_mensais with (security_invoker = true) as
select date_trunc('month', ap.concluida_em)::date as mes,
       round(sum(a.duracao_segundos) / 3600.0, 1) as horas
from aula_progresso ap
join aulas a on a.id = ap.aula_id
where ap.concluida
group by 1
order by 1;

create view public.vw_admin_resumo with (security_invoker = true) as
select
  (select count(*) from profiles)                                         as usuarios,
  (select count(*) from treinamentos where status = 'ativo')              as treinamentos_ativos,
  (select count(*) from matriculas where progresso = 100)                 as concluidos,
  (select count(*) from certificados)                                     as certificados;

-- Cards do dashboard do usuário (em andamento, concluídos, certificados, favoritos, horas)
create view public.vw_meu_resumo with (security_invoker = true) as
select
  p.id as user_id,
  (select count(*) from matriculas m where m.user_id = p.id and m.progresso > 0 and m.progresso < 100) as em_andamento,
  (select count(*) from matriculas m where m.user_id = p.id and m.progresso = 100)                    as concluidos,
  (select count(*) from certificados c where c.user_id = p.id)                                         as certificados,
  (select count(*) from favoritos f where f.user_id = p.id)                                            as favoritos,
  (select coalesce(round(sum(a.duracao_segundos) / 3600.0, 1), 0)
     from aula_progresso ap join aulas a on a.id = ap.aula_id
    where ap.user_id = p.id and ap.concluida)                                                          as horas_estudadas
from profiles p;

-- ---------------------------------------------------------------------
-- RLS
-- Catálogo: qualquer usuário logado lê, só admin escreve.
-- Dados do usuário: cada um vê/edita os seus; admin vê todos.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'configuracoes','categorias','treinamentos','modulos','aulas','aula_materiais',
    'videos','documentos','quizzes','quiz_perguntas','quiz_alternativas',
    'trilhas','trilha_etapas','certificado_modelos'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "leitura autenticada" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "admin escreve" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  foreach t in array array[
    'matriculas','aula_progresso','favoritos','quiz_tentativas','nexa_mensagens'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "dono ou admin le" on public.%I for select to authenticated using (user_id = auth.uid() or public.is_admin())', t);
    execute format('create policy "dono escreve" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Alternativa correta do quiz não deve ser exposta ao aluno: o front deve
-- consultar a view abaixo; a tabela fica restrita a admin.
drop policy "leitura autenticada" on public.quiz_alternativas;
create view public.vw_quiz_alternativas_publicas with (security_invoker = false) as
select id, pergunta_id, ordem, texto from public.quiz_alternativas;
grant select on public.vw_quiz_alternativas_publicas to authenticated;

-- Campos protegidos: o Supabase concede UPDATE na tabela inteira, então
-- revoke por coluna não funciona; um trigger bloqueia a alteração por não-admin.
create or replace function public.proteger_campos()
returns trigger language plpgsql as $$
begin
  if public.is_admin() or auth.uid() is null then
    return new;
  end if;
  if tg_table_name = 'matriculas' then
    -- aproveitamento vem do quiz, não do aluno
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

create trigger trg_matriculas_protegidos before insert or update on public.matriculas
  for each row execute function public.proteger_campos();

alter table public.profiles enable row level security;
create policy "le o proprio ou admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "edita o proprio" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admin gerencia" on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Usuário comum não pode se promover a admin nem se reativar.
create trigger trg_profiles_protegidos before update on public.profiles
  for each row execute function public.proteger_campos();

alter table public.certificados enable row level security;
create policy "dono ou admin le" on public.certificados for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
-- Inserção apenas via função emitir_certificado (security definer).

alter table public.notificacoes enable row level security;
create policy "destinatario le" on public.notificacoes for select to authenticated
  using (destinatario_id is null or destinatario_id = auth.uid() or public.is_admin());
create policy "admin escreve" on public.notificacoes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

alter table public.notificacao_leituras enable row level security;
create policy "dono" on public.notificacao_leituras for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.aula_comentarios enable row level security;
create policy "leitura autenticada" on public.aula_comentarios for select to authenticated using (true);
create policy "autor cria" on public.aula_comentarios for insert to authenticated with check (user_id = auth.uid());
create policy "autor ou admin apaga" on public.aula_comentarios for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.logs_atividade enable row level security;
create policy "admin le" on public.logs_atividade for select to authenticated using (public.is_admin());
create policy "usuario registra" on public.logs_atividade for insert to authenticated with check (user_id = auth.uid());
