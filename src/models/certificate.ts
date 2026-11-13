export interface CertificateTraining {
  treinamentoId?: string;
  titulo: string;
  categoria: string;
  cargaHoraria: string;
  /** Duração do treinamento em minutos (vira "62 horas" no certificado). */
  cargaHorariaMinutos?: number;
  progresso: number;
  aproveitamento: number | null;
  emitido: boolean;
  codigo: string | null;
  dataEmissao: string | null;
}
