export type TrainingLevel = "Básico" | "Intermediário" | "Avançado";
export type ContentType = "video" | "texto" | "doc" | "quiz" | "aula";

export interface TrainingContent {
  id?: string;
  tipo: ContentType;
  titulo: string;
  url: string;
  texto: string;
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
