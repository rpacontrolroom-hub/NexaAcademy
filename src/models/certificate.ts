export interface CertificateTraining {
  treinamentoId?: string;
  titulo: string;
  categoria: string;
  cargaHoraria: string;
  progresso: number;
  aproveitamento: number | null;
  emitido: boolean;
  codigo: string | null;
  dataEmissao: string | null;
  templateId?: string | null;
}

export type CertificateTemplateStatus = "active" | "draft";

export interface CertificateTemplate {
  id: string;
  treinamentoId?: string;
  name: string;
  courseTitle: string;
  typeLabel: string;
  accentColor: string;
  minimumScore: number;
  signerName: string;
  signerRole: string;
  programContent: string[];
  sourceFileName: string;
  sourceFileUrl?: string;
  status: CertificateTemplateStatus;
  createdAt: string;
}

export type CertificateTemplateDraft = Omit<CertificateTemplate, "id" | "createdAt" | "treinamentoId">;

export interface CertificateTemplateValidation {
  valid: boolean;
  errors: Partial<Record<keyof CertificateTemplateDraft, string>>;
}
