export type TrainingLevel = "Básico" | "Intermediário" | "Avançado";
export type ContentType = "video" | "texto" | "doc" | "quiz" | "aula";

/** Material de apoio da aula. `arquivo` existe só enquanto o upload não foi feito. */
export interface TrainingMaterial {
  id?: string;
  titulo: string;
  arquivoUrl?: string | null;
  tamanhoBytes?: number | null;
  arquivo?: File;
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
  modulos: TrainingModule[];
}
