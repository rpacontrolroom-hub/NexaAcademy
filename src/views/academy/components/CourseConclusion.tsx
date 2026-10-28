import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Clock3, Layers3, PlayCircle, Send, Star, Trophy, Users } from "lucide-react";

import { keys, useAvaliacoesTreinamento, useConcluintes } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";
import { initials, timeAgo } from "@/lib/format";
import type { CourseDetail } from "@/models/course-detail";

const conclusionCss = `
  .course-conclusion { display:flex; flex-direction:column; gap:16px; padding:4px 0 0; }
  .course-conclusion-hero { position:relative; overflow:hidden; padding:28px 26px; color:#fff; background:linear-gradient(135deg,#1f3d2b,#2d7147 60%,#3e9160); border-radius:12px; }
  .course-conclusion-hero::after { content:""; position:absolute; right:-60px; top:-60px; width:220px; height:220px; border-radius:50%; background:rgba(255,255,255,.08); }
  .course-conclusion-badge { width:52px; height:52px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; border-radius:50%; background:rgba(255,255,255,.16); }
  .course-conclusion-hero h2 { margin:0 0 6px; font-size:21px; font-weight:700; letter-spacing:-.01em; }
  .course-conclusion-hero p { margin:0; max-width:560px; color:rgba(255,255,255,.85); font-size:12.5px; line-height:1.55; }
  .course-conclusion-stats { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
  .course-conclusion-stat { display:inline-flex; align-items:center; gap:6px; padding:6px 11px; border-radius:999px; background:rgba(255,255,255,.14); font-size:11px; font-weight:600; }
  .course-conclusion-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:18px; position:relative; z-index:1; }
  .course-conclusion-btn { display:inline-flex; align-items:center; gap:7px; min-height:38px; padding:0 15px; border-radius:7px; font:600 12px Inter,sans-serif; cursor:pointer; }
  .course-conclusion-btn.light { color:#1f3d2b; background:#fff; border:1px solid #fff; }
  .course-conclusion-btn.ghost { color:#fff; background:transparent; border:1px solid rgba(255,255,255,.45); }
  .course-conclusion-pending { padding:11px 14px; border:1px solid #f1d9a6; border-radius:9px; background:#fff8e8; color:#7a5412; font-size:12.5px; line-height:1.45; }
  .course-conclusion-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:16px; }
  .course-conclusion-card { padding:16px 18px; border:1px solid #e3e3e3; border-radius:10px; background:#fff; }
  .course-conclusion-card h3 { display:flex; align-items:center; gap:8px; margin:0 0 4px; font-size:13.5px; font-weight:700; color:#111; }
  .course-conclusion-card small { color:#888; font-size:11.5px; }
  .course-conclusion-stars { display:flex; gap:4px; margin:12px 0 10px; }
  .course-conclusion-stars button { padding:2px; border:0; background:transparent; color:#d0d0d0; cursor:pointer; transition:transform .1s ease; }
  .course-conclusion-stars button:hover { transform:scale(1.12); }
  .course-conclusion-stars button.on { color:#e3a008; }
  .course-conclusion-card textarea { width:100%; min-height:64px; padding:9px 11px; border:1px solid #ddd; border-radius:8px; font:400 12.5px Inter,sans-serif; color:#111; resize:vertical; outline:none; }
  .course-conclusion-card textarea:focus { border-color:#111; }
  .course-conclusion-send { display:inline-flex; align-items:center; gap:7px; min-height:36px; margin-top:8px; padding:0 14px; border:0; border-radius:7px; background:#111; color:#fff; font:600 12px Inter,sans-serif; cursor:pointer; }
  .course-conclusion-send:disabled { opacity:.35; cursor:not-allowed; }
  .course-conclusion-people { display:flex; flex-direction:column; margin-top:10px; }
  .course-conclusion-person { display:flex; align-items:center; gap:10px; padding:8px 0; border-top:1px solid #f0f0f0; }
  .course-conclusion-person:first-child { border-top:0; }
  .course-conclusion-avatar { width:32px; height:32px; flex:0 0 32px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #d7d7d7; border-radius:50%; background:#f7f7f7; color:#111; font-size:11px; font-weight:700; }
  .course-conclusion-avatar img { width:100%; height:100%; object-fit:cover; }
  .course-conclusion-person-name { flex:1; min-width:0; overflow:hidden; color:#111; font-size:12.5px; font-weight:600; white-space:nowrap; text-overflow:ellipsis; }
  .course-conclusion-you { margin-left:6px; padding:1px 7px; border-radius:999px; background:#e7f4ec; color:#2d7147; font-size:10px; font-weight:700; }
  .course-conclusion-when { color:#999; font-size:11px; white-space:nowrap; }
  .course-conclusion-empty { padding:14px 0 4px; color:#888; font-size:12px; }
  .course-conclusion-locked { display:grid; place-items:center; min-height:240px; padding:24px; color:#777; background:#fafafa; border:1px dashed #ddd; border-radius:10px; text-align:center; font-size:12.5px; }
  @media (max-width:900px) { .course-conclusion-grid { grid-template-columns:1fr; } }
`;

interface CourseConclusionProps {
  userId?: string;
  treinamentoId: string;
  course: CourseDetail;
  matricula?: repo.Matricula;
  /** Avaliação final do treinamento ainda sem aprovação (o certificado depende dela). */
  avaliacaoPendente: boolean;
  onOpenCertificates?: () => void;
  onReviewLessons: () => void;
}

const ROTULOS = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

export default function CourseConclusion({ userId, treinamentoId, course, matricula, avaliacaoPendente, onOpenCertificates, onReviewLessons }: CourseConclusionProps) {
  const queryClient = useQueryClient();
  const lessons = course.modules.flatMap((m) => m.lessons);
  const concluido = course.progress >= 100 || (lessons.length > 0 && lessons.every((l) => l.completed));
  const { data: concluintes } = useConcluintes(treinamentoId, concluido);
  const { data: avaliacoes } = useAvaliacoesTreinamento(treinamentoId, userId, concluido);

  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Preenche com a avaliação já enviada, para o aluno poder alterar.
  useEffect(() => {
    if (!avaliacoes?.minha) return;
    setNota(avaliacoes.minha.nota);
    setComentario(avaliacoes.minha.comentario ?? "");
  }, [avaliacoes?.minha]);

  if (!concluido) {
    return (
      <div className="course-conclusion">
        <style>{conclusionCss}</style>
        <div className="course-conclusion-locked">
          <div><Trophy size={26} /><p style={{ margin: "8px 0 0" }}>Conclua todas as aulas para liberar a conclusão do treinamento.</p></div>
        </div>
      </div>
    );
  }

  async function enviarAvaliacao() {
    if (!nota || enviando) return;
    setEnviando(true);
    try {
      await repo.avaliarTreinamento(treinamentoId, nota, comentario);
      toast.success(avaliacoes?.minha ? "Avaliação atualizada. Obrigado!" : "Obrigado pela avaliação!");
      queryClient.invalidateQueries({ queryKey: keys.avaliacoesTreinamento(treinamentoId, userId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setEnviando(false);
    }
  }

  const estrelas = hover || nota;
  const pessoas = concluintes?.pessoas ?? [];
  const outros = Math.max(0, (concluintes?.total ?? 0) - pessoas.length);

  return (
    <div className="course-conclusion">
      <style>{conclusionCss}</style>

      <section className="course-conclusion-hero">
        <div className="course-conclusion-badge"><Trophy size={26} /></div>
        <h2>Parabéns, você concluiu o treinamento!</h2>
        <p>Você finalizou todas as aulas de <strong>{course.title}</strong>. Conte para a gente o que achou e veja quem também chegou até aqui.</p>
        <div className="course-conclusion-stats">
          <span className="course-conclusion-stat"><Layers3 size={13} />{course.modules.length} módulos</span>
          <span className="course-conclusion-stat"><PlayCircle size={13} />{lessons.length} aulas</span>
          <span className="course-conclusion-stat"><Clock3 size={13} />{course.totalDuration}</span>
          {matricula?.aproveitamento != null && <span className="course-conclusion-stat"><Award size={13} />{Number(matricula.aproveitamento)}% de aproveitamento</span>}
        </div>
        <div className="course-conclusion-actions">
          {onOpenCertificates && !avaliacaoPendente && (
            <button className="course-conclusion-btn light" type="button" onClick={onOpenCertificates}><Award size={14} />Ver meu certificado</button>
          )}
          <button className="course-conclusion-btn ghost" type="button" onClick={onReviewLessons}><PlayCircle size={14} />Rever aulas</button>
        </div>
      </section>

      {avaliacaoPendente && (
        <div className="course-conclusion-pending">Falta só a <strong>avaliação final</strong> (logo abaixo) para liberar o seu certificado.</div>
      )}

      <div className="course-conclusion-grid">
        <section className="course-conclusion-card" aria-label="Avaliar treinamento">
          <h3><Star size={15} />Avalie este treinamento</h3>
          <small>
            {avaliacoes?.media != null
              ? `Nota média ${avaliacoes.media.toFixed(1).replace(".", ",")} · ${avaliacoes.total} ${avaliacoes.total === 1 ? "avaliação" : "avaliações"}`
              : "Seja o primeiro a avaliar."}
          </small>
          <div className="course-conclusion-stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={n <= estrelas ? "on" : ""} onMouseEnter={() => setHover(n)} onClick={() => setNota(n)} aria-label={`${n} de 5 estrelas`} title={ROTULOS[n]}>
                <Star size={26} fill={n <= estrelas ? "currentColor" : "none"} />
              </button>
            ))}
            {estrelas > 0 && <span style={{ alignSelf: "center", marginLeft: 6, color: "#555", fontSize: 12, fontWeight: 600 }}>{ROTULOS[estrelas]}</span>}
          </div>
          <textarea value={comentario} maxLength={1000} onChange={(e) => setComentario(e.target.value)} placeholder="Comentário opcional: o que foi mais útil? O que pode melhorar?" aria-label="Comentário sobre o treinamento" />
          <button className="course-conclusion-send" type="button" onClick={enviarAvaliacao} disabled={!nota || enviando}>
            <Send size={13} />{enviando ? "Enviando..." : avaliacoes?.minha ? "Atualizar avaliação" : "Enviar avaliação"}
          </button>
        </section>

        <section className="course-conclusion-card" aria-label="Quem também concluiu">
          <h3><Users size={15} />Quem também concluiu</h3>
          <small>{concluintes?.total ? `${concluintes.total} ${concluintes.total === 1 ? "pessoa concluiu" : "pessoas concluíram"} este treinamento` : "Últimas conclusões"}</small>
          {pessoas.length === 0 ? (
            <div className="course-conclusion-empty">Nenhuma conclusão registrada ainda.</div>
          ) : (
            <div className="course-conclusion-people">
              {pessoas.map((p) => (
                <div className="course-conclusion-person" key={p.user_id}>
                  <div className="course-conclusion-avatar">{p.avatar_url ? <img src={p.avatar_url} alt="" /> : initials(p.nome)}</div>
                  <span className="course-conclusion-person-name">{p.nome}{p.user_id === userId && <span className="course-conclusion-you">Você</span>}</span>
                  <span className="course-conclusion-when">{timeAgo(p.concluido_em)}</span>
                </div>
              ))}
              {outros > 0 && <div className="course-conclusion-empty">e mais {outros} {outros === 1 ? "pessoa" : "pessoas"}</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
