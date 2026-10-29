-- Treinamento não listado: continua ativo e acessível (matrícula, trilha, certificado),
-- mas não aparece no catálogo "Todos os cursos" dos alunos.
alter table public.treinamentos
  add column if not exists nao_listado boolean not null default false;
