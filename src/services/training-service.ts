import type { TrainingDraft, TrainingModule } from "@/models/training";

export function validateTrainingDraft(training: TrainingDraft) {
  const validTitle = training.title.trim().length > 2;
  const validDuration = training.dur.trim().length > 0;
  const validModules = training.modulos.length > 0 && training.modulos.every((module) =>
    module.titulo.trim().length > 0 && module.itens.length > 0 && module.itens.every((item) =>
      item.titulo.trim().length > 0 && (item.tipo !== "texto" || item.texto.trim().length > 0),
    ),
  );
  return { validTitle, validDuration, validModules, canSave: validTitle && validDuration && validModules };
}

export function sanitizeModules(modules: TrainingModule[]): TrainingModule[] {
  return modules.map((module) => ({ ...module, titulo: module.titulo.trim(), imagem: module.imagem || "", itens: module.itens.map((item) => ({ ...item, titulo: item.titulo.trim(), url: item.url.trim(), texto: item.texto.trim() })) }));
}
