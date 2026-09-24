import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Gauge,
  ListChecks,
  Play,
  Target,
} from "lucide-react";

import { courseController } from "@/controllers/course-controller";
import { keys, useAula, useComentarios, useCursoDetalhe } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";
import { formatBytes, timeAgo, youtubeId } from "@/lib/format";
import type { LessonDetail } from "@/models/lesson-detail";

interface LessonDetailViewProps {
  userId?: string;
  course?: repo.Treinamento;
  matricula?: repo.Matricula;
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

const extraLessonCss = `
  .lesson-player { position:relative; margin:16px; aspect-ratio:16/9; overflow:hidden; background:#000; border-radius:9px; }
  .lesson-player iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
  .lesson-text { margin:16px; padding:18px; white-space:pre-wrap; color:#333; background:#fafafa; border:1px solid #e4e4e4; border-radius:9px; font-size:12.5px; line-height:1.7; }
  .lesson-open-link { display:inline-flex; align-items:center; gap:7px; margin-top:14px; padding:9px 14px; color:#fff; background:#111; border-radius:7px; font-size:11.5px; font-weight:600; text-decoration:none; }
  .lesson-comment { padding:12px 0; border-bottom:1px solid #eee; }
  .lesson-comment:last-child { border-bottom:0; }
  .lesson-comment-meta { color:#888; font-size:10.5px; margin-bottom:4px; }
  .lesson-comment-form { display:flex; flex-direction:column; gap:8px; margin-top:16px; }
  .lesson-comment-form textarea { min-height:70px; padding:10px 12px; border:1px solid #ddd; border-radius:8px; font:inherit; font-size:12px; resize:vertical; }
  .lesson-material-row a { color:inherit; }
`;

export default function LessonDetailView({ userId, course: treinamento, matricula, lessonId, onBack, onNavigate }: LessonDetailViewProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "transcript" | "materials" | "discussion">("overview");
  const [comentario, setComentario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { course, isLoading } = useCursoDetalhe(userId, treinamento, matricula?.progresso ?? 0);
  const { data: aula } = useAula(lessonId);
  const { data: comentarios = [] } = useComentarios(activeTab === "discussion" ? lessonId : null);

  function invalidarProgresso() {
    for (const queryKey of [["concluidas"], ["matriculas"], ["meu-resumo"], ["meus-certificados"], keys.adminResumo]) {
      queryClient.invalidateQueries({ queryKey });
    }
  }

  // Abrir a aula registra a matrícula no treinamento (na primeira vez).
  useEffect(() => {
    if (!userId || !lessonId) return;
    repo.registrarAulaAberta(userId, lessonId).then(() => {
      if (!matricula) invalidarProgresso();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, lessonId]);

  if (!course) {
    return (
      <section className="lesson-detail">
        <p style={{ color: "#777", fontSize: 13 }}>{isLoading ? "Carregando aula..." : "A aula selecionada não está disponível."}</p>
        {!isLoading && <button className="lesson-nav-button" onClick={onBack}>Voltar ao curso</button>}
      </section>
    );
  }

  const details: Record<string, LessonDetail> = aula
    ? {
        [lessonId]: {
          lessonId,
          title: aula.titulo,
          description: aula.descricao ?? "",
          summary: aula.resumo ?? "",
          objectives: aula.objetivos ?? [],
          learnings: aula.aprendizados ?? [],
          materials: (aula.materiais ?? []).map((m) => ({ id: m.id, title: m.titulo, size: formatBytes(m.tamanho_bytes) })),
        },
      }
    : {};
  const context = courseController.getLessonContext(course, lessonId, details);

  if (!context) {
    return (
      <section className="lesson-detail">
        <p>A aula selecionada não está disponível. Conclua os módulos anteriores para liberá-la.</p>
        <button className="lesson-nav-button" onClick={onBack}>Voltar ao curso</button>
      </section>
    );
  }

  const { lesson, module, previousLesson, nextLesson, detail } = context;
  const completed = lesson.completed;
  const videoId = youtubeId(aula?.url);

  async function alternarConcluida() {
    if (!userId || salvando) return;
    setSalvando(true);
    try {
      await repo.definirAulaConcluida(userId, lessonId, !completed);
      invalidarProgresso();
      if (!completed && nextLesson) toast.success("Aula concluída! Siga para a próxima.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  async function enviarComentario() {
    if (!comentario.trim()) return;
    try {
      await repo.adicionarComentario(lessonId, comentario);
      setComentario("");
      queryClient.invalidateQueries({ queryKey: keys.comentarios(lessonId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="lesson-detail">
      <style>{lessonDetailCss}</style>
      <style>{extraLessonCss}</style>
      <div className="lesson-detail-breadcrumb">
        <button onClick={onBack}>Treinamentos</button><ChevronRight size={12} />
        <button onClick={onBack}>{course.title}</button><ChevronRight size={12} />
        <span>{module.order}. {module.title}</span>
      </div>

      <header className="lesson-detail-header">
        <div>
          <h1 className="lesson-detail-title">{module.order}. {detail.title}</h1>
          <p className="lesson-detail-description">{detail.description}</p>
        </div>
        <button className={`lesson-detail-complete ${completed ? "done" : ""}`} onClick={alternarConcluida} disabled={salvando}>
          <CheckCircle2 size={15} /> {completed ? "Concluída" : "Marcar como concluída"}
        </button>
      </header>

      <div className="lesson-detail-chips">
        <span className="lesson-detail-chip"><Clock3 size={13} />{lesson.duration}</span>
        <span className="lesson-detail-chip"><BookOpen size={13} />Módulo {module.order} de {course.modules.length}</span>
        <span className="lesson-detail-chip"><BarChart3 size={13} />{course.progress}% concluído</span>
        <span className="lesson-detail-chip"><Gauge size={13} />{course.level}</span>
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
                {videoId ? (
                  <div className="lesson-player">
                    <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={detail.title} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                ) : aula?.tipo === "texto" && aula.conteudo ? (
                  <div className="lesson-text">{aula.conteudo}</div>
                ) : (
                  <div className="lesson-video">
                    <div className="lesson-video-brand" style={{ fontSize: 18, top: 60 }}>{aula?.url ? "Conteúdo externo" : "Conteúdo em preparação"}</div>
                    {aula?.url
                      ? <a className="lesson-video-play" href={aula.url} target="_blank" rel="noreferrer" aria-label="Abrir conteúdo"><ExternalLink size={24} /></a>
                      : <span className="lesson-video-play" style={{ opacity: .35, cursor: "default" }}><Play size={25} fill="#fff" /></span>}
                  </div>
                )}
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

            {activeTab === "transcript" && (
              <div className="lesson-tab-content">
                <h3>Transcrição</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{aula?.transcricao || "A transcrição desta aula ainda não foi cadastrada."}</p>
              </div>
            )}
            {activeTab === "materials" && <div className="lesson-tab-content"><h3>Materiais</h3><p>Consulte os arquivos disponíveis no painel lateral para complementar seus estudos.</p></div>}
            {activeTab === "discussion" && (
              <div className="lesson-tab-content">
                <h3>Discussão</h3>
                {comentarios.length === 0 && <p>Nenhum comentário ainda. Tire sua dúvida ou compartilhe algo sobre a aula.</p>}
                {comentarios.map((c) => (
                  <div className="lesson-comment" key={c.id}>
                    <div className="lesson-comment-meta"><strong style={{ color: "#333" }}>{c.autor}</strong> · {timeAgo(c.created_at)}</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{c.conteudo}</div>
                  </div>
                ))}
                <div className="lesson-comment-form">
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escreva um comentário..." />
                  <div><button className="lesson-nav-button next" onClick={enviarComentario} disabled={!comentario.trim()}>Comentar</button></div>
                </div>
              </div>
            )}
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
            {aula?.materiais?.length ? (
              <div className="lesson-material-list">
                {aula.materiais.map((material) => (
                  <div className="lesson-material-row" key={material.id}>
                    <FileText size={14} />
                    {material.arquivo_url ? <a href={material.arquivo_url} target="_blank" rel="noreferrer">{material.titulo}</a> : <span>{material.titulo}</span>}
                    <span className="lesson-material-size">{formatBytes(material.tamanho_bytes)}</span>
                    {material.arquivo_url ? <a href={material.arquivo_url} download aria-label={`Baixar ${material.titulo}`}><Download size={13} /></a> : <Download size={13} style={{ opacity: .3 }} />}
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
