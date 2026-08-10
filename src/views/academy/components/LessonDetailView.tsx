import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Gauge,
  ListChecks,
  Play,
  RotateCcw,
  Settings,
  Target,
  Volume2,
} from "lucide-react";

import { courseController } from "@/controllers/course-controller";
import { onboardingCourse } from "@/mocks/course-detail";
import { lessonDetails } from "@/mocks/lesson-detail";

interface LessonDetailViewProps {
  lessonId: string;
  onBack: () => void;
  onNavigate: (lessonId: string) => void;
}

const lessonDetailCss = `
  .lesson-detail { color:#111; }
  .lesson-detail-breadcrumb { display:flex; align-items:center; flex-wrap:wrap; gap:9px; margin-bottom:18px; color:#777; font-size:11.5px; }
  .lesson-detail-breadcrumb button { padding:0; color:#666; background:none; border:0; cursor:pointer; }
  .lesson-detail-breadcrumb button:hover { color:#111; }
  .lesson-detail-header { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:20px; }
  .lesson-detail-title { margin:0 0 7px; font-size:25px; font-weight:700; letter-spacing:-.02em; }
  .lesson-detail-description { max-width:850px; margin:0; color:#666; font-size:12.5px; line-height:1.55; }
  .lesson-detail-complete { display:flex; align-items:center; gap:7px; min-height:38px; padding:0 14px; flex-shrink:0; color:#333; background:#fff; border:1px solid #ddd; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; }
  .lesson-detail-complete.done { color:#fff; background:#2d7147; border-color:#2d7147; }
  .lesson-detail-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; }
  .lesson-detail-chip { display:flex; align-items:center; gap:6px; padding:7px 11px; color:#444; background:#fff; border:1px solid #dedede; border-radius:999px; font-size:10.5px; font-weight:600; }
  .lesson-detail-grid { display:grid; grid-template-columns:minmax(0,1fr) 350px; gap:22px; }
  .lesson-detail-main, .lesson-detail-side-card { background:#fff; border:1px solid #dedede; border-radius:13px; box-shadow:0 5px 18px rgba(0,0,0,.025); }
  .lesson-detail-main { overflow:hidden; }
  .lesson-detail-tabs { display:flex; gap:28px; padding:0 20px; border-bottom:1px solid #e7e7e7; }
  .lesson-detail-tab { position:relative; padding:16px 4px 14px; color:#777; background:none; border:0; font-size:11.5px; cursor:pointer; }
  .lesson-detail-tab.active { color:#111; font-weight:700; }
  .lesson-detail-tab.active::after { content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:#111; }
  .lesson-video { position:relative; height:310px; margin:16px; overflow:hidden; background:linear-gradient(160deg,#f9f9f9,#ececec); border:1px solid #e2e2e2; border-radius:9px; }
  .lesson-video::before, .lesson-video::after { content:""; position:absolute; left:-8%; right:-8%; height:130px; border-radius:50%; background:rgba(255,255,255,.78); transform:rotate(3deg); }
  .lesson-video::before { bottom:22px; }
  .lesson-video::after { bottom:-52px; background:rgba(230,230,230,.85); transform:rotate(-4deg); }
  .lesson-video-brand { position:absolute; top:42px; left:50%; z-index:2; transform:translateX(-50%); color:#222; font-size:30px; font-weight:300; letter-spacing:-.04em; }
  .lesson-video-play { position:absolute; top:50%; left:50%; z-index:3; width:62px; height:62px; display:flex; align-items:center; justify-content:center; transform:translate(-50%,-50%); color:#fff; background:#111; border:0; border-radius:50%; cursor:pointer; box-shadow:0 12px 26px rgba(0,0,0,.2); }
  .lesson-video-controls { position:absolute; left:0; right:0; bottom:0; z-index:4; display:flex; align-items:center; gap:13px; height:42px; padding:0 14px; color:#fff; background:linear-gradient(transparent,rgba(0,0,0,.86)); font-size:10px; }
  .lesson-video-progress { position:absolute; left:0; right:0; top:0; height:3px; background:rgba(255,255,255,.35); }
  .lesson-video-progress span { display:block; width:0; height:100%; background:#fff; }
  .lesson-video-spacer { flex:1; }
  .lesson-overview { padding:4px 16px 0; }
  .lesson-overview-top { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid #e8e8e8; border-bottom:1px solid #e8e8e8; }
  .lesson-overview-section { padding:18px 4px 18px; }
  .lesson-overview-section + .lesson-overview-section { padding-left:22px; border-left:1px solid #e8e8e8; }
  .lesson-section-title { display:flex; align-items:center; gap:9px; margin:0 0 10px; font-size:13px; font-weight:700; }
  .lesson-overview-section p { margin:0; color:#555; font-size:11px; line-height:1.65; }
  .lesson-list { margin:0; padding-left:17px; color:#555; font-size:11px; line-height:1.7; }
  .lesson-learnings { padding:18px 4px 22px; }
  .lesson-learning-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; }
  .lesson-learning { display:flex; align-items:flex-start; gap:8px; color:#555; font-size:11px; line-height:1.45; }
  .lesson-learning svg { flex:0 0 auto; margin-top:2px; }
  .lesson-tab-content { min-height:530px; padding:26px; color:#555; font-size:12px; line-height:1.7; }
  .lesson-tab-content h3 { margin:0 0 10px; color:#111; font-size:16px; }
  .lesson-detail-side { display:flex; flex-direction:column; gap:16px; }
  .lesson-detail-side-card { padding:16px; }
  .lesson-detail-side-title { display:flex; align-items:center; justify-content:space-between; margin:0 0 13px; font-size:13px; font-weight:700; }
  .lesson-content-list, .lesson-material-list { overflow:hidden; border:1px solid #e4e4e4; border-radius:9px; }
  .lesson-content-row { display:grid; grid-template-columns:20px minmax(0,1fr) auto 18px; align-items:center; gap:8px; min-height:43px; padding:0 11px; color:#666; background:#fff; border:0; border-bottom:1px solid #e8e8e8; width:100%; text-align:left; font-size:10.5px; cursor:pointer; }
  .lesson-content-row:last-child { border-bottom:0; }
  .lesson-content-row:hover { background:#fafafa; }
  .lesson-content-row.active { color:#111; background:#f1f1f1; font-weight:700; }
  .lesson-content-duration { font-variant-numeric:tabular-nums; }
  .lesson-material-row { display:grid; grid-template-columns:20px minmax(0,1fr) auto 18px; align-items:center; gap:8px; min-height:43px; padding:0 11px; color:#555; border-bottom:1px solid #e8e8e8; font-size:10.5px; }
  .lesson-material-row:last-child { border-bottom:0; }
  .lesson-material-size { color:#777; font-size:9.5px; }
  .lesson-no-material { padding:24px; color:#777; text-align:center; font-size:11px; }
  .lesson-detail-navigation { display:flex; align-items:center; justify-content:space-between; margin-top:20px; }
  .lesson-nav-button { display:flex; align-items:center; gap:8px; min-height:40px; padding:0 16px; color:#111; background:#fff; border:1px solid #ddd; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; }
  .lesson-nav-button.next { color:#fff; background:#111; border-color:#111; }
  .lesson-nav-button:disabled { opacity:.35; cursor:not-allowed; }
  @media (max-width:1100px) { .lesson-detail-grid { grid-template-columns:1fr; } .lesson-detail-side { display:grid; grid-template-columns:1fr 1fr; } }
  @media (max-width:700px) {
    .lesson-detail-header { flex-direction:column; }
    .lesson-detail-complete { width:100%; justify-content:center; }
    .lesson-detail-side { display:flex; }
    .lesson-video { height:230px; }
    .lesson-overview-top, .lesson-learning-grid { grid-template-columns:1fr; }
    .lesson-overview-section + .lesson-overview-section { padding-left:4px; border-left:0; border-top:1px solid #e8e8e8; }
  }
`;

export default function LessonDetailView({ lessonId, onBack, onNavigate }: LessonDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "materials" | "discussion">("overview");
  const [completed, setCompleted] = useState(false);
  const context = courseController.getLessonContext(onboardingCourse, lessonId, lessonDetails);

  if (!context) {
    return (
      <section className="lesson-detail">
        <p>A aula selecionada não está disponível.</p>
        <button className="lesson-nav-button" onClick={onBack}>Voltar ao curso</button>
      </section>
    );
  }

  const { lesson, module, previousLesson, nextLesson, detail } = context;

  return (
    <section className="lesson-detail">
      <style>{lessonDetailCss}</style>
      <div className="lesson-detail-breadcrumb">
        <button onClick={onBack}>Treinamentos</button><ChevronRight size={12} />
        <button onClick={onBack}>{onboardingCourse.title}</button><ChevronRight size={12} />
        <span>{module.order}. {module.title}</span>
      </div>

      <header className="lesson-detail-header">
        <div>
          <h1 className="lesson-detail-title">{module.order}. {detail.title}</h1>
          <p className="lesson-detail-description">{detail.description}</p>
        </div>
        <button className={`lesson-detail-complete ${completed ? "done" : ""}`} onClick={() => setCompleted((value) => !value)}>
          <CheckCircle2 size={15} /> {completed ? "Concluída" : "Marcar como concluída"}
        </button>
      </header>

      <div className="lesson-detail-chips">
        <span className="lesson-detail-chip"><Clock3 size={13} />{lesson.duration}</span>
        <span className="lesson-detail-chip"><BookOpen size={13} />Módulo {module.order} de {onboardingCourse.modules.length}</span>
        <span className="lesson-detail-chip"><BarChart3 size={13} />{onboardingCourse.progress}% concluído</span>
        <span className="lesson-detail-chip"><Gauge size={13} />Avançado</span>
      </div>

      <div className="lesson-detail-grid">
        <div>
          <article className="lesson-detail-main">
            <nav className="lesson-detail-tabs" aria-label="Seções da aula">
              {[
                ["overview", "Visão geral"], ["transcript", "Transcrição"],
                ["materials", "Materiais"], ["discussion", "Discussão"],
              ].map(([key, label]) => (
                <button key={key} className={`lesson-detail-tab ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key as typeof activeTab)}>{label}</button>
              ))}
            </nav>

            {activeTab === "overview" && (
              <>
                <div className="lesson-video">
                  <div className="lesson-video-brand">blueprism<sup>®</sup></div>
                  <button className="lesson-video-play" aria-label="Reproduzir aula"><Play size={25} fill="#fff" /></button>
                  <div className="lesson-video-controls">
                    <div className="lesson-video-progress"><span /></div>
                    <Play size={14} fill="#fff" /><RotateCcw size={14} /><span>00:00 / {lesson.duration}</span>
                    <span className="lesson-video-spacer" /><Volume2 size={14} /><Settings size={14} />
                  </div>
                </div>
                <div className="lesson-overview">
                  <div className="lesson-overview-top">
                    <section className="lesson-overview-section">
                      <h2 className="lesson-section-title"><ListChecks size={16} />Resumo da aula</h2>
                      <p>{detail.summary}</p>
                    </section>
                    <section className="lesson-overview-section">
                      <h2 className="lesson-section-title"><Target size={16} />Objetivos</h2>
                      <ul className="lesson-list">{detail.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
                    </section>
                  </div>
                  <section className="lesson-learnings">
                    <h2 className="lesson-section-title"><BookOpen size={16} />O que você vai aprender</h2>
                    <div className="lesson-learning-grid">
                      {detail.learnings.map((item) => <div className="lesson-learning" key={item}><Check size={13} />{item}</div>)}
                    </div>
                  </section>
                </div>
              </>
            )}

            {activeTab === "transcript" && <div className="lesson-tab-content"><h3>Transcrição</h3><p>A transcrição acompanha o conteúdo apresentado no vídeo e ficará disponível durante a reprodução da aula.</p></div>}
            {activeTab === "materials" && <div className="lesson-tab-content"><h3>Materiais</h3><p>Consulte os arquivos disponíveis no painel lateral para complementar seus estudos.</p></div>}
            {activeTab === "discussion" && <div className="lesson-tab-content"><h3>Discussão</h3><p>Espaço demonstrativo para dúvidas e comentários relacionados à aula.</p></div>}
          </article>

          <div className="lesson-detail-navigation">
            <button className="lesson-nav-button" disabled={!previousLesson} onClick={() => previousLesson && onNavigate(previousLesson.id)}><ChevronLeft size={15} />Aula anterior</button>
            <button className="lesson-nav-button next" disabled={!nextLesson} onClick={() => nextLesson && onNavigate(nextLesson.id)}>Próxima aula<ChevronRight size={15} /></button>
          </div>
        </div>

        <aside className="lesson-detail-side">
          <section className="lesson-detail-side-card">
            <h2 className="lesson-detail-side-title">Conteúdo da aula</h2>
            <div className="lesson-content-list">
              {module.lessons.map((item, index) => (
                <button key={item.id} className={`lesson-content-row ${item.id === lesson.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
                  <span>{index + 1}.</span><span>{item.title}</span><span className="lesson-content-duration">{item.duration}</span>
                  {item.completed ? <CheckCircle2 size={15} /> : item.id === lesson.id ? <Play size={14} /> : <span style={{ width:14, height:14, border:"1px solid #aaa", borderRadius:"50%" }} />}
                </button>
              ))}
            </div>
          </section>

          <section className="lesson-detail-side-card">
            <h2 className="lesson-detail-side-title">Materiais da aula <Download size={15} /></h2>
            {detail.materials.length ? (
              <div className="lesson-material-list">
                {detail.materials.map((material) => (
                  <div className="lesson-material-row" key={material.id}>
                    <FileText size={14} /><span>{material.title}</span><span className="lesson-material-size">{material.size}</span><Download size={13} />
                  </div>
                ))}
              </div>
            ) : <div className="lesson-no-material">Nenhum material disponível para esta aula.</div>}
          </section>
        </aside>
      </div>
    </section>
  );
}
