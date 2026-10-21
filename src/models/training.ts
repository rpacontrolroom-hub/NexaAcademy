export type TrainingLevel = "Básico" | "Intermediário" | "Avançado";
export type ContentType = "video" | "texto" | "doc" | "quiz" | "aula";

/** Material de apoio da aula: nome + link (Google Drive). */
export interface TrainingMaterial {
  id?: string;
  titulo: string;
  arquivoUrl?: string | null;
  /** Só em materiais antigos, enviados ao Storage. */
  tamanhoBytes?: number | null;
}

export interface TrainingContent {
  id?: string;
  tipo: ContentType;
  titulo: string;
  url: string;
  texto: string;
  materiais?: TrainingMaterial[];
  /** Item do tipo quiz: quiz do treinamento (tabela quizzes) exibido nesta aula. */
  quizId?: string;
}

export interface TrainingModule {
  id?: string;
  titulo: string;
  imagem: string;
  /** Materiais do módulo: aparecem em todas as aulas dele. */
  materiais?: TrainingMaterial[];
  itens: TrainingContent[];
}

export interface TrainingDraft {
  title: string;
  cat: string;
  level: TrainingLevel;
  dur: string;
  desc: string;
  /** URL da capa atual, data URL de uma imagem nova (enviada ao salvar) ou "" sem capa. */
  capa?: string;
  modulos: TrainingModule[];
}
