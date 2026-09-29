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
}

export interface TrainingModule {
  id?: string;
  titulo: string;
  imagem: string;
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
