import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Play,
} from "lucide-react";

import { courseController } from "@/controllers/course-controller";
import { keys, useAula, useCursoDetalhe, useQuizzesDaAula } from "@/hooks/use-academy";
import QuizPlayer from "@/views/academy/components/QuizPlayer";
import { PERCENTUAL_MINIMO_VIDEO, useProgressoVideo } from "@/hooks/use-progresso-video";
import LessonComments from "@/views/academy/components/LessonComments";
import * as repo from "@/data/academy-repository";
import { formatBytes, youtubeId } from "@/lib/format";
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
  .lesson-detail-grid { display:grid; grid-template-columns:minmax(0,1fr) 350px; gap:22px; }
  .lesson-detail-main, .lesson-detail-side-card { background:#fff; border:1px solid #dedede; border-radius:13px; box-shadow:0 5px 18px rgba(0,0,0,.025); }
  .lesson-detail-main { overflow:hidden; }
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
    .lesson-detail-navigation { flex-direction:column-reverse; align-items:stretch; gap:10px; }
    .lesson-nav-right { justify-content:stretch; }
    .lesson-nav-right > * { flex:1; justify-content:center; }
    .lesson-detail-side { display:flex; }
    .lesson-video { height:230px; }
  }
`;

const extraLessonCss = `
  .lesson-player-shell { display:flex; flex-direction:column; margin:16px; overflow:hidden; background:#000; border-radius:9px; }
  .lesson-player { position:relative; aspect-ratio:16/9; overflow:hidden; background:#000; }
  .lesson-player iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
  .lesson-player-bar { display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:40px; padding:0 8px 0 14px; background:#0f0f0f; border-top:1px solid #222; color:#ddd; }
  .lesson-player-bar-title { overflow:hidden; font-size:12px; white-space:nowrap; text-overflow:ellipsis; }
  .lesson-player-bar button { width:34px; height:34px; display:flex; align-items:center; justify-content:center; flex-shrink:0; padding:0; border:0; border-radius:6px; background:transparent; color:#fff; cursor:pointer; }
  .lesson-player-bar button:hover { background:rgba(255,255,255,.12); }
  .lesson-player-shell:fullscreen { margin:0; border-radius:0; }
  .lesson-player-shell:fullscreen .lesson-player { flex:1; aspect-ratio:auto; }
  .lesson-player-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:-4px 16px 16px; }
  .lesson-done-hint { color:#888; font-size:11.5px; }
  .lesson-watch { display:flex; flex-direction:column; gap:6px; min-width:220px; flex:1; max-width:420px; }
  .lesson-watch-track { height:4px; overflow:hidden; border-radius:999px; background:#e3e3e3; }
  .lesson-watch-track span { display:block; height:100%; background:#2d7147; transition:width .3s ease; }
  .lesson-skip-warning { display:flex; align-items:flex-start; gap:9px; margin:0 16px 16px; padding:11px 14px; border:1px solid #f1d9a6; border-radius:9px; background:#fff8e8; color:#7a5412; font-size:12.5px; line-height:1.45; }
  .lesson-skip-warning svg { flex:0 0 auto; margin-top:1px; }
  .lesson-nav-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
  .lesson-complete-button { display:flex; align-items:center; gap:8px; min-height:40px; padding:0 16px; color:#8a8a8a; background:#ececec; border:1px solid #e0e0e0; border-radius:7px; font-size:11px; font-weight:700; cursor:not-allowed; transition:background .2s ease, color .2s ease, border-color .2s ease; }
  .lesson-complete-button.ready { color:#fff; background:#2d7147; border-color:#2d7147; cursor:pointer; }
  .lesson-complete-button.ready:hover { background:#255d3a; }
  .lesson-complete-button.done { color:#2d7147; background:#e7f4ec; border-color:#cfe8d8; cursor:default; }
  .lesson-text { margin:16px; padding:18px; white-space:pre-wrap; color:#333; background:#fafafa; border:1px solid #e4e4e4; border-radius:9px; font-size:12.5px; line-height:1.7; }
  .lesson-open-link { display:inline-flex; align-items:center; gap:7px; margin-top:14px; padding:9px 14px; color:#fff; background:#111; border-radius:7px; font-size:11.5px; font-weight:600; text-decoration:none; }
  .lesson-material-row a { color:inherit; }
`;

/** O Storage do Supabase força o download com `?download=<nome>`; mantém a extensão original. */
function linkDownload(url: string, titulo: string) {
  const extensao = url.split("?")[0].match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  const nome = titulo.toLowerCase().endsWith(extensao.toLowerCase()) ? titulo : `${titulo}${extensao}`;
  return `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(nome)}`;
}

export default function LessonDetailView({ userId, course: treinamento, matricula, lessonId, onBack, onNavigate }: LessonDetailViewProps) {
  const queryClient = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Atualizado a cada render com a ação atual (depende de "completed" e da aula aberta).
  const aoAssistirMinimoRef = useRef<() => void>(() => {});
  const { course, isLoading } = useCursoDetalhe(userId, treinamento, matricula?.progresso ?? 0);
  const { data: aula } = useAula(lessonId);

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

  // Acompanha a tela cheia (inclusive ao sair com Esc) para trocar o ícone do botão.
  const [telaCheia, setTelaCheia] = useState(false);
  useEffect(() => {
    const atualizar = () => setTelaCheia(!!document.fullscreenElement && document.fullscreenElement === playerRef.current);
    document.addEventListener("fullscreenchange", atualizar);
    return () => document.removeEventListener("fullscreenchange", atualizar);
  }, []);

  // Aula de vídeo: só conclui depois de assistir o mínimo exigido (pular não conta).
  const videoIdAula = youtubeId(aula?.url);
  const { percentual: percentualAssistido, chegouAoFim, escutarPlayer } = useProgressoVideo(
    iframeRef,
    userId && videoIdAula ? lessonId : null,
    userId && videoIdAula ? `nexa:video:${userId}:${lessonId}:${videoIdAula}` : null,
    () => aoAssistirMinimoRef.current(),
    repo.registrarProgressoVideo,
  );
  const { data: quizzesDaAula = [] } = useQuizzesDaAula(lessonId);

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
  const videoId = videoIdAula;
  const videoLiberado = !videoId || completed || percentualAssistido >= PERCENTUAL_MINIMO_VIDEO;
  // Aula com quiz: só conclui depois de ser aprovado em todos os quizzes dela.
  const quizLiberado = completed || quizzesDaAula.every((q) => q.tentativas.some((t) => t.aprovado));
  const podeConcluir = videoLiberado && quizLiberado;
  const motivoBloqueio = !videoLiberado
    ? `Assista pelo menos ${PERCENTUAL_MINIMO_VIDEO}% do vídeo para concluir a aula.`
    : !quizLiberado ? "Seja aprovado no quiz desta aula para concluí-la." : undefined;

  async function concluirAula() {
    if (!userId || completed || salvando) return;
    if (!podeConcluir) {
      toast.info(motivoBloqueio);
      return;
    }
    setSalvando(true);
    try {
      await repo.concluirAula(userId, lessonId);
      invalidarProgresso();
      toast.success(nextLesson ? "Aula concluída! Siga para a próxima." : "Aula concluída!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }
  aoAssistirMinimoRef.current = () => {
    if (!completed) toast.success("Vídeo assistido! Agora você pode concluir a aula.");
  };

  function maximizarVideo() {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => toast.error("Não foi possível abrir o vídeo em tela cheia."));
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
      </header>

      <div className="lesson-detail-grid">
        <div>
          <article className="lesson-detail-main">
            {videoId ? (
              <>
                {/* A barra fica colada ao player (fora da área do YouTube, que não pode ser coberta) e vai junto para a tela cheia. */}
                <div className="lesson-player-shell" ref={playerRef}>
                  <div className="lesson-player">
                    {/* rel=0: sugestões só do mesmo canal; iv_load_policy=3: sem anotações; playsinline: não força tela cheia no celular;
                        enablejsapi: permite medir quanto do vídeo foi assistido para concluir a aula. */}
                    <iframe ref={iframeRef} onLoad={escutarPlayer} src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin)}`} title={detail.title} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                  </div>
                  <div className="lesson-player-bar">
                    <span className="lesson-player-bar-title">{detail.title}</span>
                    <button type="button" onClick={maximizarVideo} aria-label={telaCheia ? "Sair da tela cheia" : "Maximizar vídeo"} title={telaCheia ? "Sair da tela cheia" : "Maximizar vídeo"}>
                      {telaCheia ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  </div>
                </div>
                {/* Depois de concluída, o status fica só no botão do rodapé ("Aula concluída"). */}
                {!completed && (
                  <div className="lesson-player-actions">
                    <div className="lesson-watch">
                      <div className="lesson-watch-track"><span style={{ width: `${percentualAssistido}%` }} /></div>
                      <span className="lesson-done-hint">
                        {videoLiberado
                          ? (quizLiberado ? "Vídeo assistido. Clique em Concluir aula para seguir." : "Vídeo assistido. Agora responda o quiz abaixo para concluir a aula.")
                          : `Você assistiu ${percentualAssistido}% · assista ${PERCENTUAL_MINIMO_VIDEO}% para liberar a conclusão`}
                      </span>
                    </div>
                  </div>
                )}
                {chegouAoFim && !videoLiberado && (
                  <div className="lesson-skip-warning" role="alert">
                    <AlertTriangle size={16} />
                    <span>Você assistiu só <strong>{percentualAssistido}%</strong> da aula. É importante ver tudo para completar essa aula.</span>
                  </div>
                )}
              </>
            ) : aula?.tipo === "texto" && aula.conteudo ? (
              <div className="lesson-text">{aula.conteudo}</div>
            ) : quizzesDaAula.length > 0 && !aula?.url ? null : (
              <div className="lesson-video">
                <div className="lesson-video-brand" style={{ fontSize: 18, top: 60 }}>{aula?.url ? "Conteúdo externo" : "Conteúdo em preparação"}</div>
                {aula?.url
                  ? <a className="lesson-video-play" href={aula.url} target="_blank" rel="noreferrer" aria-label="Abrir conteúdo"><ExternalLink size={24} /></a>
                  : <span className="lesson-video-play" style={{ opacity: .35, cursor: "default" }}><Play size={25} fill="#fff" /></span>}
              </div>
            )}
            {quizzesDaAula.map((quiz) => (
              <div key={quiz.id} style={{ borderTop: "1px solid #e7e7e7" }}>
                <QuizPlayer quiz={quiz} />
              </div>
            ))}
          </article>

          <div className="lesson-detail-navigation">
            <button className="lesson-nav-button" disabled={!previousLesson} onClick={() => previousLesson && onNavigate(previousLesson.id)}><ChevronLeft size={15} />Aula anterior</button>
            <div className="lesson-nav-right">
              {completed ? (
                <span className="lesson-complete-button done"><CheckCircle2 size={15} />Aula concluída</span>
              ) : (
                <button
                  className={`lesson-complete-button ${podeConcluir ? "ready" : ""}`}
                  onClick={concluirAula}
                  disabled={salvando || !podeConcluir}
                  title={motivoBloqueio}
                >
                  <CheckCircle2 size={15} />{salvando ? "Concluindo..." : "Concluir aula"}
                </button>
              )}
              {completed && (nextLesson
                ? <button className="lesson-nav-button next" onClick={() => onNavigate(nextLesson.id)}>Próxima aula<ChevronRight size={15} /></button>
                : <button className="lesson-nav-button next" onClick={onBack}>Voltar ao treinamento<ChevronRight size={15} /></button>)}
            </div>
          </div>

          <LessonComments aulaId={lessonId} userId={userId} />
        </div>

        <aside className="lesson-detail-side">
          <section className="lesson-detail-side-card">
            <h2 className="lesson-detail-side-title">Conteúdo da aula</h2>
            <div className="lesson-content-list">
              {module.lessons.map((item, index) => (
                <button key={item.id} className={`lesson-content-row ${item.id === lesson.id ? "active" : ""}`} onClick={() => onNavigate(item.id)}>
                  <span>{index + 1}.</span><span>{item.title}</span><span className="lesson-content-duration">{item.duration}</span>
                  {item.completed ? <CheckCircle2 size={15} color="#2d7147" /> : item.id === lesson.id ? <Play size={14} /> : <span style={{ width:14, height:14, border:"1px solid #aaa", borderRadius:"50%" }} />}
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
                    {material.arquivo_url ? <a href={linkDownload(material.arquivo_url, material.titulo)} aria-label={`Baixar ${material.titulo}`}><Download size={13} /></a> : <Download size={13} style={{ opacity: .3 }} />}
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
