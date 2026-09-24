-- =====================================================================
-- Nexa Academy — carga inicial com os dados que hoje estão mocados.
-- Rodar DEPOIS da migration. Dados de usuário (progresso, certificados
-- emitidos, favoritos) não entram aqui: dependem de usuários reais no Auth.
-- =====================================================================

insert into configuracoes (chave, valor, descricao) values
  ('dominio_corporativo',       '"@ciahering.com.br"', 'Domínio permitido no cadastro de usuários'),
  ('nota_minima_certificado',   '90',                  'Aproveitamento mínimo padrão para emitir certificado'),
  ('certificado_assinante_nome','"Rael P. Borges"',    'Assinante padrão dos certificados'),
  ('certificado_assinante_cargo','"Coordenador de CoE RPA, Agentic AI & Processos AZZAS"', 'Cargo do assinante padrão');

insert into categorias (nome, ordem) values
  ('Blue Prism', 1), ('Power Automate', 2), ('Python', 3), ('Integrações', 4),
  ('SQL', 5), ('APIs', 6), ('SAP', 7), ('IA', 8), ('Boas Práticas', 9), ('Onboarding', 10);

-- Treinamentos (courses + cursos citados nos modelos de certificado)
insert into treinamentos (slug, titulo, categoria_id, nivel, duracao_minutos, capa_url, icone, gradiente_inicio, gradiente_fim, descricao)
select v.slug, v.titulo, c.id, v.nivel::nivel_treinamento, v.minutos, v.capa, v.icone, v.g1, v.g2, v.descr
from (values
  ('onboarding-rpa',             'Onboarding RPA',                'Onboarding',     'Iniciante',     200, null,                              'Workflow',    '#2DD4E8', '#3D6BFF', 'Trilha de integração para novos colaboradores do time de RPA, dos fundamentos ao projeto final.'),
  ('introducao-time-rpa',        'Introdução ao Time RPA',        'Onboarding',     'Básico',         38, null,                              'Workflow',    '#2DD4E8', '#3D6BFF', null),
  ('blue-prism-basico',          'Blue Prism Básico',             'Blue Prism',     'Básico',        120, null,                              'Workflow',    '#3D6BFF', '#2DD4E8', null),
  ('blue-prism-avancado',        'Blue Prism Avançado',           'Blue Prism',     'Avançado',      200, '/course-blue-prism-advanced.png', 'Workflow',    '#3D6BFF', '#2DD4E8', null),
  ('control-room',               'Control Room',                  'Blue Prism',     'Intermediário', 120, null,                              'Database',    '#9B6BFF', '#3D6BFF', null),
  ('work-queues-na-pratica',     'Work Queues na prática',        'Blue Prism',     'Intermediário', 105, '/course-work-queues.png',         'Database',    '#9B6BFF', '#3D6BFF', null),
  ('python-para-automacao',      'Python para Automação',         'Python',         'Intermediário', 250, '/course-python-automation.png',   'Code2',       '#2DD4E8', '#6E3FD9', null),
  ('apis-rest-fastapi',          'APIs REST com FastAPI',         'APIs',           'Avançado',      170, '/course-api-cover.png',           'Network',     '#3D6BFF', '#9B6BFF', null),
  ('power-automate-basico',      'Power Automate Básico',         'Power Automate', 'Básico',        125, null,                              'Cpu',         '#2DD4E8', '#3D6BFF', null),
  ('fundamentos-power-automate', 'Fundamentos de Power Automate', 'Power Automate', 'Básico',        125, '/course-power-automate.png',      'Cpu',         '#2DD4E8', '#3D6BFF', null),
  ('boas-praticas-governanca',   'Boas Práticas de Governança',   'Boas Práticas',  'Básico',         70, '/course-governance.png',          'ShieldCheck', '#9B6BFF', '#2DD4E8', null)
) as v(slug, titulo, categoria, nivel, minutos, capa, icone, g1, g2, descr)
join categorias c on c.nome = v.categoria;

-- Módulos do Onboarding RPA (onboardingCourse)
insert into modulos (treinamento_id, ordem, titulo, descricao)
select t.id, v.ordem, v.titulo,
       case when v.ordem = 1 then 'Conheça o time de RPA, papéis, responsabilidades e como trabalhamos.'
            else 'Conteúdo e atividades do módulo ' || v.titulo || '.' end
from treinamentos t,
     (values (1,'Introdução ao Time'),(2,'Blue Prism Básico'),(3,'Blue Prism Avançado'),(4,'Control Room'),
             (5,'Work Queues'),(6,'Exceptions'),(7,'Power Automate'),(8,'Python'),(9,'Integrações'),(10,'Projeto Final')
     ) as v(ordem, titulo)
where t.slug = 'onboarding-rpa';

-- Aulas do Onboarding RPA
insert into aulas (modulo_id, ordem, codigo, titulo, tipo, duracao_segundos)
select m.id, v.ordem, v.codigo, v.titulo, v.tipo::tipo_aula, v.seg
from (values
  (1,1,'1.1','Boas-vindas e visão geral','doc',315),
  (1,2,'1.2','Estrutura do time de RPA','doc',450),
  (1,3,'1.3','Papéis e responsabilidades','video',525),
  (1,4,'1.4','Ferramentas e ambiente','video',740),
  (1,5,'1.5','Nossos valores e cultura','doc',250),
  (2,1,'2.1','Fundamentos do Blue Prism','video',570),
  (2,2,'2.2','Primeiro processo automatizado','video',860),
  (3,1,'3.1','Introdução ao módulo avançado','doc',315),
  (3,2,'3.2','Dynamic System Settings','doc',450),
  (3,3,'3.3','Collections e Data Items Complexos','doc',525),
  (3,4,'3.4','Blue Prism Avançado','video',2205),
  (3,5,'3.5','Padrões de Design','video',740),
  (3,6,'3.6','Tratamento Avançado de Exceções','doc',640),
  (3,7,'3.7','Otimização de Performance','video',555),
  (3,8,'3.8','Boas Práticas e Recomendações','doc',390)
) as v(mod_ordem, ordem, codigo, titulo, tipo, seg)
join modulos m on m.ordem = v.mod_ordem
join treinamentos t on t.id = m.treinamento_id and t.slug = 'onboarding-rpa';

-- Detalhe da aula 3.4 (lessonDetails)
update aulas a set
  descricao = 'Aprofunde seus conhecimentos em recursos avançados da plataforma Blue Prism para automações robustas e escaláveis.',
  resumo = 'Nesta aula, você irá explorar recursos avançados do Blue Prism para criar automações mais inteligentes, reutilizáveis e fáceis de manter. Abordaremos padrões de design, tratamento avançado de exceções e otimização de desempenho.',
  objetivos = array[
    'Explorar recursos avançados do Blue Prism',
    'Aplicar padrões de design reutilizáveis',
    'Implementar tratamento avançado de exceções',
    'Otimizar performance e manutenção de processos'],
  aprendizados = array[
    'Utilizar Dynamic System Settings de forma avançada',
    'Trabalhar com collections e data items complexos',
    'Implementar Business Objects reutilizáveis',
    'Aplicar padrões de design em automações',
    'Tratar exceções com granularidade',
    'Monitorar e otimizar performance de processos']
from modulos m join treinamentos t on t.id = m.treinamento_id
where a.modulo_id = m.id and t.slug = 'onboarding-rpa' and a.codigo = '3.4';

insert into aula_materiais (aula_id, titulo, tamanho_bytes, ordem)
select a.id, v.titulo, v.bytes, v.ordem
from (values
  (1,'Slides da aula (PDF)',1258291),
  (2,'Exercício prático',253952),
  (3,'Checklist de boas práticas',327680),
  (4,'Template - Business Object',79872)
) as v(ordem, titulo, bytes)
join aulas a on a.codigo = '3.4'
join modulos m on m.id = a.modulo_id
join treinamentos t on t.id = m.treinamento_id and t.slug = 'onboarding-rpa';

-- Trilhas
insert into trilhas (titulo, descricao, cor) values
  ('Onboarding RPA', 'Trilha de integração para novos colaboradores do time de RPA, dos fundamentos ao projeto final.', 'cyan'),
  ('Especialista Power Automate', 'Do básico à automação avançada de processos com Power Automate e conectores corporativos.', 'purple'),
  ('Python para RPA', 'Scripts, automações, APIs e integrações usando Python aplicadas ao dia a dia do time.', 'blue');

insert into trilha_etapas (trilha_id, ordem, titulo, treinamento_id)
select tr.id, v.ordem, v.titulo, (select id from treinamentos where slug = v.slug)
from (values
  ('Onboarding RPA',1,'Introdução ao Time','introducao-time-rpa'),
  ('Onboarding RPA',2,'Blue Prism Básico','blue-prism-basico'),
  ('Onboarding RPA',3,'Blue Prism Avançado','blue-prism-avancado'),
  ('Onboarding RPA',4,'Control Room','control-room'),
  ('Onboarding RPA',5,'Work Queues','work-queues-na-pratica'),
  ('Onboarding RPA',6,'Exceptions',null),
  ('Onboarding RPA',7,'Power Automate','power-automate-basico'),
  ('Onboarding RPA',8,'Python','python-para-automacao'),
  ('Onboarding RPA',9,'Integrações',null),
  ('Onboarding RPA',10,'Projeto Final',null),
  ('Especialista Power Automate',1,'Fundamentos','fundamentos-power-automate'),
  ('Especialista Power Automate',2,'Flows na prática',null),
  ('Especialista Power Automate',3,'Conectores',null),
  ('Especialista Power Automate',4,'Aprovações',null),
  ('Especialista Power Automate',5,'Projeto Final',null),
  ('Python para RPA',1,'Sintaxe e Lógica',null),
  ('Python para RPA',2,'Bibliotecas RPA',null),
  ('Python para RPA',3,'Manipulação de Dados','python-para-automacao'),
  ('Python para RPA',4,'APIs com FastAPI','apis-rest-fastapi'),
  ('Python para RPA',5,'Integrações',null),
  ('Python para RPA',6,'Projeto Final',null)
) as v(trilha, ordem, titulo, slug)
join trilhas tr on tr.titulo = v.trilha;

-- Modelos de certificado (defaultCertificateTemplates)
insert into certificado_modelos (treinamento_id, nome, assinante_nome, assinante_cargo, conteudo_programatico, arquivo_nome, arquivo_url, status)
select t.id, 'Certificado — ' || t.titulo, 'Rael P. Borges',
       'Coordenador de CoE RPA, Agentic AI & Processos AZZAS',
       v.programa,
       'Template Certificados da Área - RPA Developer 2.pptx',
       '/certificates/modelo-certificado-base.pptx',
       'active'
from (values
  ('introducao-time-rpa',        array['Boas-vindas e visão geral','Estrutura do time de RPA','Papéis e responsabilidades','Ferramentas e ambiente','Valores e cultura']),
  ('blue-prism-basico',          array['Configuração do ambiente','Process Studio','Fluxo de processo','Inputs e outputs','Objeto de negócio','Object Studio','Gestão de erros','Boas práticas']),
  ('blue-prism-avancado',        array['Dynamic System Settings','Collections e Data Items complexos','Business Objects reutilizáveis','Padrões de design','Tratamento avançado de exceções','Otimização de performance']),
  ('control-room',               array['Visão geral do Control Room','Filas e sessões','Agendamento de processos','Monitoramento operacional','Gestão de recursos','Auditoria e logs']),
  ('work-queues-na-pratica',     array['Fundamentos de Work Queues','Criação e configuração de filas','Priorização de itens','Tratamento de exceções','Retries e defer','Monitoramento e relatórios']),
  ('python-para-automacao',      array['Fundamentos de Python','Manipulação de dados','Automação de arquivos','Integração com APIs','Tratamento de erros','Scripts para rotinas RPA']),
  ('apis-rest-fastapi',          array['Fundamentos de APIs REST','Rotas e métodos HTTP','Modelos e validação','Autenticação','Integração com bancos de dados','Testes e documentação']),
  ('power-automate-basico',      array['Fundamentos do Power Automate','Fluxos automatizados','Gatilhos e ações','Conectores','Condições e aprovações','Monitoramento de execuções']),
  ('fundamentos-power-automate', array['Fundamentos do Power Automate','Fluxos automatizados','Gatilhos e ações','Conectores','Condições e aprovações','Monitoramento de execuções']),
  ('boas-praticas-governanca',   array['Governança de automações','Papéis e responsabilidades','Gestão de acessos','Padrões e documentação','Monitoramento e auditoria','Melhoria contínua'])
) as v(slug, programa)
join treinamentos t on t.slug = v.slug;

-- Vídeos (AdminVideosView)
insert into videos (titulo, treinamento_id, duracao_segundos, status, visualizacoes)
select v.titulo, t.id, v.seg, v.status::status_publicacao, v.views
from (values
  ('Introdução ao módulo avançado','blue-prism-avancado',315,'publicado',184),
  ('Work Queues — Tratamento de Exceções','work-queues-na-pratica',640,'publicado',126),
  ('Primeiros endpoints com FastAPI','apis-rest-fastapi',740,'rascunho',0),
  ('Automação de arquivos com Python','python-para-automacao',525,'publicado',93)
) as v(titulo, slug, seg, status, views)
join treinamentos t on t.slug = v.slug;
