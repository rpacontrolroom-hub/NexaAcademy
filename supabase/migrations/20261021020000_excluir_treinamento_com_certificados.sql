-- Excluir treinamento falhava quando algum aluno já tinha certificado dele:
-- certificados.treinamento_id era "on delete restrict". A confirmação do painel
-- já avisa que os certificados vinculados são removidos junto, então a FK passa
-- a apagar em cascata.
alter table public.certificados
  drop constraint if exists certificados_treinamento_id_fkey;

alter table public.certificados
  add constraint certificados_treinamento_id_fkey
  foreign key (treinamento_id) references public.treinamentos(id) on delete cascade;
