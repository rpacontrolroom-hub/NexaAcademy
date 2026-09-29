import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Layers3,
  Lock,
  Play,
  Star,
  Video,
} from "lucide-react";

import { courseController } from "@/controllers/course-controller";
import { useCursoDetalhe } from "@/hooks/use-academy";
import type { Matricula, Treinamento } from "@/data/academy-repository";

interface CourseDetailViewProps {
  userId?: string;
  course?: Treinamento;
  matricula?: Matricula;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}

const courseDetailCss = `
  .course-detail { color:#111; }
  .course-detail-breadcrumb { display:flex; align-items:center; gap:10px; margin-bottom:16px; color:#777; font-size:12px; }
  .course-detail-breadcrumb button { padding:0; color:#666; background:none; border:0; cursor:pointer; }
  .course-detail-breadcrumb button:hover { color:#111; }
  .course-detail-summary { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:26px; }
  .course-detail-title { margin:0 0 8px; font-size:26px; font-weight:700; letter-spacing:-.02em; }
  .course-detail-description { margin:0; color:#666; font-size:13.5px; line-height:1.5; }
  .course-detail-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; }
  .course-detail-chip { display:inline-flex; align-items:center; gap:5px; padding:7px 11px; color:#333; background:#fff; border:1px solid #dedede; border-radius:999px; font-size:11px; font-weight:600; }
  .course-detail-actions { display:flex; gap:10px; padding-top:26px; flex-shrink:0; }
  .course-detail-primary, .course-detail-secondary { min-height:42px; padding:0 18px; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; }
  .course-detail-primary { display:flex; align-items:center; gap:8px; color:#fff; background:#111; border:1px solid #111; }
  .course-detail-secondary { color:#333; background:#fff; border:1px solid #d9d9d9; }
  .course-detail-secondary.is-complete { color:#fff; background:#2d7147; border-color:#2d7147; }
  .course-detail-panel { overflow:hidden; background:#fff; border:1px solid #dedede; border-radius:14px; box-shadow:0 5px 18px rgba(0,0,0,.025); }
  .course-detail-tabs { display:flex; gap:28px; padding:0 24px; border-bottom:1px solid #e8e8e8; }
  .course-detail-tab { position:relative; padding:17px 6px 15px; color:#777; background:none; border:0; font-size:12.5px; cursor:pointer; }
  .course-detail-tab.active { color:#111; font-weight:700; }
  .course-detail-tab.active::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:#111; }
  .course-detail-layout { display:grid; grid-template-columns:290px minmax(0,1fr); gap:18px; padding:18px; }
  .course-detail-modules { padding:5px 0; background:#fafafa; border:1px solid #e3e3e3; border-radius:10px; }
  .course-detail-module { width:100%; display:flex; align-items:center; gap:10px; min-height:43px; padding:8px 12px; color:#333; text-align:left; background:transparent; border:0; font-size:11.5px; cursor:pointer; }
  .course-detail-module:hover:not(:disabled) { background:#f1f1f1; }
  .course-detail-module.active { color:#111; background:#ededed; font-weight:700; }
  .course-detail-module:disabled { color:#777; cursor:not-allowed; }
  .course-detail-module-state { width:20px; height:20px; display:flex; align-items:center; justify-content:center; flex:0 0 20px; border:1px solid #999; border-radius:50%; font-size:10px; font-weight:700; }
  .course-detail-module-state.completed { color:#fff; background:#2d7147; border-color:#2d7147; }
  .course-detail-module-state.current { color:#fff; background:#111; border-color:#111; }
  .course-detail-content { min-width:0; padding:4px 0 0; }
  .course-detail-module-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:0 6px 18px; }
  .course-detail-module-title { display:flex; align-items:center; gap:10px; margin-bottom:5px; font-size:15px; font-weight:700; }
  .course-detail-module-description { margin:0 0 0 30px; color:#777; font-size:11.5px; }
  .course-detail-status { padding:5px 9px; color:#111; background:#fff; border:1px solid #ddd; border-radius:6px; font-size:10.5px; font-weight:700; }
  .course-detail-lessons { overflow:hidden; border:1px solid #e3e3e3; border-radius:10px; }
  .course-detail-lesson { display:grid; grid-template-columns:22px minmax(0,1fr) auto 22px; align-items:center; gap:9px; min-height:50px; padding:0 16px; color:#666; border-bottom:1px solid #e8e8e8; font-size:11.5px; }
  .course-detail-lesson:last-child { border-bottom:0; }
  .course-detail-lesson { cursor:pointer; }
  .course-detail-lesson:hover { color:#111; background:#fafafa; }
  .course-detail-lesson-duration { color:#777; font-variant-numeric:tabular-nums; }
  .course-detail-empty { display:grid; place-items:center; min-height:240px; color:#777; background:#fafafa; border:1px dashed #ddd; border-radius:10px; text-align:center; }
  .course-detail-empty p { margin:8px 0 0; font-size:12px; }
  .course-detail-about { min-height:360px; padding:30px; color:#555; font-size:13px; line-height:1.7; }
  .course-detail-about h3 { margin:0 0 10px; color:#111; font-size:17px; }
  .course-detail-navigation { display:flex; align-items:center; justify-content:space-between; padding:16px 6px 0; }
  .course-detail-nav-button { display:flex; align-items:center; gap:8px; min-height:38px; padding:0 14px; color:#111; background:#fff; border:1px solid #ddd; border-radius:7px; font-size:11.5px; font-weight:600; cursor:pointer; }
  .course-detail-nav-button.next { color:#fff; background:#111; border-color:#111; }
  .course-detail-nav-button:disabled { opacity:.35; cursor:not-allowed; }
  @media (max-width:900px) {
    .course-detail-summary { flex-direction:column; }
    .course-detail-actions { padding-top:0; }
    .course-detail-layout { grid-template-columns:1fr; }
    .course-detail-modules { display:flex; overflow-x:auto; padding:6px; }
    .course-detail-module { min-width:210px; }
  }
  @media (max-width:600px) {
    .course-detail-actions { width:100%; flex-direction:column; }
    .course-detail-primary, .course-detail-secondary { justify-content:center; width:100%; }
    .course-detail-tabs { gap:10px; padding:0 12px; }
    .course-detail-layout { padding:12px; }
    .course-detail-lesson { grid-template-columns:20px minmax(0,1fr) auto; padding:0 10px; }
    .course-detail-lesson > :last-child { display:none; }
  }
`;

export default function CourseDetailView({ userId, course: treinamento, matricula, isFavorite, onToggleFavorite, onBack, onOpenLesson }: CourseDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"content" | "about" | "materials">("content");
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const { course, isLoading } = useCursoDetalhe(userId, treinamento, matricula?.progresso ?? 0);

  if (!treinamento) {
    return (
      <section className="course-detail">
        <p>Treinamento não encontrado.</p>
        <button className="course-detail-secondary" onClick={onBack}>Voltar</button>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="course-detail">
        <style>{courseDetailCss}</style>
        <p style={{ color: "#777", fontSize: 13 }}>{isLoading ? "Carregando conteúdo..." : "Não foi possível carregar o conteúdo."}</p>
      </section>
    );
  }

  // Abre no módulo atual (primeiro não concluído) até o usuário escolher outro.
  const currentIndex = Math.max(0, course.modules.findIndex((m) => m.status === "current"));
  const moduleIndex = selectedModuleIndex ?? currentIndex;
  const selectedModule = course.modules[moduleIndex];
  const completedModules = courseController.getCompletedModuleCount(course);
  const allLessons = course.modules.filter((m) => m.status !== "locked").flatMap((m) => m.lessons);
  const nextLessonId = (matricula?.ultima_aula_id && allLessons.some((l) => l.id === matricula.ultima_aula_id && !l.completed)
    ? matricula.ultima_aula_id
    : allLessons.find((l) => !l.completed)?.id) ?? allLessons[0]?.id;

  const selectModule = (index: number) => {
    const module = course.modules[index];
    if (module && courseController.canSelectModule(module)) setSelectedModuleIndex(index);
  };

  return (
    <section className="course-detail">
      <style>{courseDetailCss}</style>
      <div className="course-detail-breadcrumb">
        <button onClick={onBack}>Treinamentos</button>
        <ChevronRight size={13} />
        <span>{course.title}</span>
      </div>

      <header className="course-detail-summary">
        <div>
          <h1 className="course-detail-title">{course.title}</h1>
          <p className="course-detail-description">{course.description}</p>
          <div className="course-detail-chips">
            <span className="course-detail-chip"><Layers3 size={13} />{course.modules.length} módulos</span>
            <span className="course-detail-chip"><CheckCircle2 size={13} />{course.level}</span>
            <span className="course-detail-chip"><CheckCircle2 size={13} />{course.progress}% concluído</span>
            <span className="course-detail-chip"><Clock3 size={13} />{course.totalDuration}</span>
          </div>
        </div>
        <div className="course-detail-actions">
          <button className="course-detail-primary" disabled={!nextLessonId} onClick={() => nextLessonId && onOpenLesson(nextLessonId)}>
            <Play size={14} /> {course.progress > 0 ? "Continuar" : "Começar"}
          </button>
          <button className={`course-detail-secondary ${isFavorite ? "is-complete" : ""}`} onClick={onToggleFavorite}>
            <Star size={13} fill={isFavorite ? "#fff" : "none"} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            {isFavorite ? "Favorito" : "Favoritar"}
          </button>
        </div>
      </header>

      <div className="course-detail-panel">
        <nav className="course-detail-tabs" aria-label="Seções do curso">
          {[
            ["content", "Conteúdo"],
            ["about", "Sobre o curso"],
            ["materials", "Materiais"],
          ].map(([key, label]) => (
            <button key={key} className={`course-detail-tab ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key as typeof activeTab)}>
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "content" && course.modules.length === 0 && (
          <div className="course-detail-about">
            <h3>Conteúdo em preparação</h3>
            <p>Este treinamento ainda não tem módulos cadastrados. Volte em breve.</p>
          </div>
        )}

        {activeTab === "content" && selectedModule && (
          <div className="course-detail-layout">
            <aside className="course-detail-modules" aria-label="Módulos do curso">
              {course.modules.map((module, index) => (
                <button
                  key={module.id}
                  className={`course-detail-module ${moduleIndex === index ? "active" : ""}`}
                  disabled={module.status === "locked"}
                  onClick={() => selectModule(index)}
                >
                  <span className={`course-detail-module-state ${module.status}`}>
                    {module.status === "completed" ? <Check size={12} /> : module.status === "locked" ? <Lock size={11} /> : module.order}
                  </span>
                  <span>{module.order}. {module.title}</span>
                </button>
              ))}
            </aside>

            <div className="course-detail-content">
              <div className="course-detail-module-header">
                <div>
                  <div className="course-detail-module-title">
                    {selectedModule.status === "completed" ? <CheckCircle2 size={20} color="#2d7147" /> : <Play size={20} />}
                    {selectedModule.order}. {selectedModule.title}
                  </div>
                  <p className="course-detail-module-description">{selectedModule.description}</p>
                </div>
                <span className="course-detail-status">
                  {selectedModule.status === "completed" ? "Concluído" : "Em andamento"}
                </span>
              </div>

              {selectedModule.lessons.length > 0 ? (
                <div className="course-detail-lessons">
                  {selectedModule.lessons.map((item, index) => (
                    <div className="course-detail-lesson" key={item.id} onClick={() => onOpenLesson(item.id)}>
                      {item.type === "video" ? <Video size={15} /> : <FileText size={15} />}
                      <span>{item.code ?? `${selectedModule.order}.${index + 1}`} {item.title}</span>
                      <span className="course-detail-lesson-duration">{item.duration}</span>
                      {item.completed ? <CheckCircle2 size={16} color="#2d7147" /> : <Play size={15} />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="course-detail-empty">
                  <div><Lock size={24} /><p>Nenhuma aula publicada neste módulo ainda.</p></div>
                </div>
              )}

              <div className="course-detail-navigation">
                <button className="course-detail-nav-button" disabled={moduleIndex === 0} onClick={() => selectModule(moduleIndex - 1)}>
                  <ChevronLeft size={15} /> Anterior
                </button>
                <button
                  className="course-detail-nav-button next"
                  disabled={moduleIndex >= completedModules || moduleIndex >= course.modules.length - 1}
                  onClick={() => selectModule(moduleIndex + 1)}
                >
                  Próximo <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="course-detail-about">
            <h3>Sobre o curso</h3>
            <p>{course.description || "Descrição não informada."}</p>
            <p>{treinamento.cat} · {course.level} · {treinamento.dur} de carga horária.</p>
          </div>
        )}

        {activeTab === "materials" && (
          <div className="course-detail-about">
            <h3>Materiais de apoio</h3>
            <p>Os materiais de cada aula ficam disponíveis no painel lateral ao abrir a aula.</p>
          </div>
        )}
      </div>
    </section>
  );
}
