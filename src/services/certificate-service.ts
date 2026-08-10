import type {
  CertificateTemplate,
  CertificateTemplateDraft,
  CertificateTemplateValidation,
  CertificateTraining,
} from "@/models/certificate";

export const MINIMUM_CERTIFICATE_SCORE = 90;

export function isCertificateEligible(training: CertificateTraining): boolean {
  return training.progresso === 100 && training.aproveitamento !== null && training.aproveitamento >= MINIMUM_CERTIFICATE_SCORE;
}

export function issueCertificate(
  training: CertificateTraining,
  now = new Date(),
  random = Math.random,
  template?: CertificateTemplate,
): CertificateTraining {
  if (!isCertificateEligible(training) || training.emitido) return training;
  const number = Math.floor(10000 + random() * 89999);
  return {
    ...training,
    emitido: true,
    codigo: `NXA-${now.getFullYear()}-${number}`,
    dataEmissao: now.toLocaleDateString("pt-BR"),
    templateId: template?.id ?? training.templateId ?? null,
  };
}

function normalizeCourseName(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function resolveCertificateTemplate(
  training: Pick<CertificateTraining, "titulo" | "templateId">,
  templates: CertificateTemplate[],
): CertificateTemplate | null {
  if (training.templateId) {
    const assigned = templates.find((template) => template.id === training.templateId);
    if (assigned) return assigned;
  }

  const activeTemplates = templates.filter((template) => template.status === "active");
  const courseName = normalizeCourseName(training.titulo);
  return activeTemplates.find((template) => normalizeCourseName(template.courseTitle) === courseName) ?? null;
}

export function validateCertificateTemplateDraft(draft: CertificateTemplateDraft): CertificateTemplateValidation {
  const errors: CertificateTemplateValidation["errors"] = {};
  if (draft.name.trim().length < 3) errors.name = "Informe um nome para o modelo.";
  if (draft.courseTitle.trim().length < 3) errors.courseTitle = "Selecione o curso vinculado.";
  if (draft.typeLabel.trim().length < 3) errors.typeLabel = "Informe o tipo do certificado.";
  if (!/^#[0-9A-F]{6}$/i.test(draft.accentColor)) errors.accentColor = "Use uma cor hexadecimal válida.";
  if (!Number.isFinite(draft.minimumScore) || draft.minimumScore < 0 || draft.minimumScore > 100) {
    errors.minimumScore = "A nota mínima deve estar entre 0 e 100.";
  }
  if (draft.signerRole.trim().length < 3) errors.signerRole = "Informe o cargo do responsável.";
  if (!draft.programContent.some((item) => item.trim().length >= 3)) errors.programContent = "Informe ao menos um conteúdo programático.";

  return { valid: Object.keys(errors).length === 0, errors };
}

export function createCertificateTemplate(
  draft: CertificateTemplateDraft,
  now = new Date(),
  random = Math.random,
): CertificateTemplate | null {
  if (!validateCertificateTemplateDraft(draft).valid) return null;
  const suffix = Math.floor(1000 + random() * 8999);
  const courseSlug = normalizeCourseName(draft.courseTitle).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return {
    ...draft,
    name: draft.name.trim(),
    courseTitle: draft.courseTitle.trim(),
    typeLabel: draft.typeLabel.trim().toLocaleUpperCase("pt-BR"),
    signerName: draft.signerName.trim(),
    signerRole: draft.signerRole.trim(),
    programContent: draft.programContent.map((item) => item.trim()).filter(Boolean),
    sourceFileName: draft.sourceFileName.trim() || "Template Certificados da Área - RPA Developer 2.pptx",
    id: `cert-${courseSlug}-${suffix}`,
    createdAt: now.toLocaleDateString("pt-BR"),
  };
}

export function createCertificatePreviewTraining(template: CertificateTemplate): CertificateTraining {
  return {
    titulo: template.courseTitle,
    categoria: "Nexa Academy",
    cargaHoraria: "2h00",
    progresso: 100,
    aproveitamento: Math.max(template.minimumScore, 95),
    emitido: true,
    codigo: "NXA-PREVIEW-2026",
    dataEmissao: new Date().toLocaleDateString("pt-BR"),
    templateId: template.id,
  };
}

export function registerCertificateTemplate(
  templates: CertificateTemplate[],
  newTemplate: CertificateTemplate,
): CertificateTemplate[] {
  const normalizedCourse = normalizeCourseName(newTemplate.courseTitle);
  const existingTemplates = templates.map((template) => (
    newTemplate.status === "active" && normalizeCourseName(template.courseTitle) === normalizedCourse
      ? { ...template, status: "draft" as const }
      : template
  ));
  return [newTemplate, ...existingTemplates];
}

export function toggleCertificateTemplateStatus(
  templates: CertificateTemplate[],
  templateId: string,
): CertificateTemplate[] {
  const selected = templates.find((template) => template.id === templateId);
  if (!selected) return templates;
  if (selected.status === "active") {
    return templates.map((template) => template.id === templateId ? { ...template, status: "draft" } : template);
  }

  const normalizedCourse = normalizeCourseName(selected.courseTitle);
  return templates.map((template) => {
    if (template.id === templateId) return { ...template, status: "active" };
    if (normalizeCourseName(template.courseTitle) === normalizedCourse) return { ...template, status: "draft" };
    return template;
  });
}
