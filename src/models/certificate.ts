export interface CertificateTraining {
  treinamentoId?: string;
  titulo: string;
  categoria: string;
  cargaHoraria: string;
  /** Duração do treinamento em minutos (vira "62 horas" no certificado). */
  cargaHorariaMinutos?: number;
  /** Títulos dos módulos, em ordem: o conteúdo programático do verso. */
  modulos?: string[];
  progresso: number;
  aproveitamento: number | null;
  emitido: boolean;
  codigo: string | null;
  dataEmissao: string | null;
}
