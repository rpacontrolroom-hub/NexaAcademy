import type { CertificateTemplate } from "@/models/certificate";

const sourceFileName = "Template Certificados da Área - RPA Developer 2.pptx";
const sourceFileUrl = "/certificates/modelo-certificado-base.pptx";

const programByCourse: Record<string, string[]> = {
  "Introdução ao Time RPA": ["Boas-vindas e visão geral", "Estrutura do time de RPA", "Papéis e responsabilidades", "Ferramentas e ambiente", "Valores e cultura"],
  "Blue Prism Básico": ["Configuração do ambiente", "Process Studio", "Fluxo de processo", "Inputs e outputs", "Objeto de negócio", "Object Studio", "Gestão de erros", "Boas práticas"],
  "Blue Prism Avançado": ["Dynamic System Settings", "Collections e Data Items complexos", "Business Objects reutilizáveis", "Padrões de design", "Tratamento avançado de exceções", "Otimização de performance"],
  "Control Room": ["Visão geral do Control Room", "Filas e sessões", "Agendamento de processos", "Monitoramento operacional", "Gestão de recursos", "Auditoria e logs"],
  "Work Queues na prática": ["Fundamentos de Work Queues", "Criação e configuração de filas", "Priorização de itens", "Tratamento de exceções", "Retries e defer", "Monitoramento e relatórios"],
  "Python para Automação": ["Fundamentos de Python", "Manipulação de dados", "Automação de arquivos", "Integração com APIs", "Tratamento de erros", "Scripts para rotinas RPA"],
  "APIs REST com FastAPI": ["Fundamentos de APIs REST", "Rotas e métodos HTTP", "Modelos e validação", "Autenticação", "Integração com bancos de dados", "Testes e documentação"],
  "Power Automate Básico": ["Fundamentos do Power Automate", "Fluxos automatizados", "Gatilhos e ações", "Conectores", "Condições e aprovações", "Monitoramento de execuções"],
  "Fundamentos de Power Automate": ["Fundamentos do Power Automate", "Fluxos automatizados", "Gatilhos e ações", "Conectores", "Condições e aprovações", "Monitoramento de execuções"],
  "Boas Práticas de Governança": ["Governança de automações", "Papéis e responsabilidades", "Gestão de acessos", "Padrões e documentação", "Monitoramento e auditoria", "Melhoria contínua"],
};

function certificateTemplate(
  id: string,
  courseTitle: string,
  minimumScore = 90,
): CertificateTemplate {
  return {
    id,
    name: `Certificado — ${courseTitle}`,
    courseTitle,
    typeLabel: "DE CONCLUSÃO",
    accentColor: "#0B5275",
    minimumScore,
    signerName: "Rael P. Borges",
    signerRole: "Coordenador de CoE RPA, Agentic AI & Processos AZZAS",
    programContent: programByCourse[courseTitle] ?? ["Conteúdo introdutório", "Conceitos fundamentais", "Aplicação prática", "Boas práticas", "Atividade de consolidação"],
    sourceFileName,
    sourceFileUrl,
    status: "active",
    createdAt: "16/07/2026",
  };
}

export const defaultCertificateTemplates: CertificateTemplate[] = [
  certificateTemplate("cert-onboarding-rpa", "Introdução ao Time RPA", 90),
  certificateTemplate("cert-blue-prism-basico", "Blue Prism Básico", 90),
  certificateTemplate("cert-blue-prism-avancado", "Blue Prism Avançado", 90),
  certificateTemplate("cert-control-room", "Control Room", 90),
  certificateTemplate("cert-work-queues", "Work Queues na prática", 90),
  certificateTemplate("cert-python-automacao", "Python para Automação", 90),
  certificateTemplate("cert-api-fastapi", "APIs REST com FastAPI", 90),
  certificateTemplate("cert-power-automate-basico", "Power Automate Básico", 90),
  certificateTemplate("cert-power-automate", "Fundamentos de Power Automate", 90),
  certificateTemplate("cert-governanca", "Boas Práticas de Governança", 90),
];
