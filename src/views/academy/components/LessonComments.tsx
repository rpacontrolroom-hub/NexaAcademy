import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { keys, useComentarios } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";
import { initials, timeAgo } from "@/lib/format";

const LIMITE_CARACTERES = 2000;

const commentsCss = `
  .lesson-comments { margin-top:20px; padding:18px 20px; background:#fff; border:1px solid #dedede; border-radius:13px; box-shadow:0 5px 18px rgba(0,0,0,.025); }
  .lesson-comments-title { display:flex; align-items:center; gap:8px; margin:0 0 14px; font-size:14px; font-weight:700; color:#111; }
  .lesson-comments-count { color:#888; font-weight:500; }
  .lesson-comment-form { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
  .lesson-comment-form textarea { width:100%; min-height:74px; padding:10px 12px; border:1px solid #ddd; border-radius:9px; font:400 13px Inter,sans-serif; color:#111; resize:vertical; outline:none; }
  .lesson-comment-form textarea:focus { border-color:#111; }
  .lesson-comment-form-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .lesson-comment-form-footer small { color:#999; font-size:11px; }
  .lesson-comment-send { display:flex; align-items:center; gap:7px; min-height:36px; padding:0 14px; border:0; border-radius:7px; background:#111; color:#fff; font:600 12px Inter,sans-serif; cursor:pointer; }
  .lesson-comment-send:disabled { opacity:.35; cursor:not-allowed; }
  .lesson-comment-list { display:flex; flex-direction:column; }
  .lesson-comment-item { display:flex; gap:11px; padding:13px 0; border-top:1px solid #efefef; }
  .lesson-comment-avatar { width:34px; height:34px; flex:0 0 34px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #d7d7d7; border-radius:50%; background:#f7f7f7; color:#111; font-size:11.5px; font-weight:700; }
  .lesson-comment-avatar img { width:100%; height:100%; object-fit:cover; }
  .lesson-comment-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .lesson-comment-author { color:#111; font-size:12.5px; font-weight:700; }
  .lesson-comment-time { color:#999; font-size:11px; }
  .lesson-comment-you { padding:1px 7px; border-radius:999px; background:#f0f0f0; color:#555; font-size:10px; font-weight:600; }
  .lesson-comment-text { margin-top:3px; color:#333; font-size:13px; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere; }
  .lesson-comment-delete { margin-left:auto; padding:4px; border:0; background:transparent; color:#aaa; cursor:pointer; border-radius:6px; }
  .lesson-comment-delete:hover { color:#c2414f; background:#fbeaec; }
  .lesson-comments-empty { padding:16px 0 4px; border-top:1px solid #efefef; color:#888; font-size:12.5px; text-align:center; }
`;

interface LessonCommentsProps {
  aulaId: string;
  userId?: string;
}

export default function LessonComments({ aulaId, userId }: LessonCommentsProps) {
  const queryClient = useQueryClient();
  const { data: comentarios = [], isLoading } = useComentarios(aulaId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const recarregar = () => queryClient.invalidateQueries({ queryKey: keys.comentarios(aulaId) });

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    try {
      await repo.adicionarComentario(aulaId, conteudo);
      setTexto("");
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir este comentário?")) return;
    try {
      await repo.excluirComentario(id);
      recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="lesson-comments" aria-label="Comentários da aula">
      <style>{commentsCss}</style>
      <h2 className="lesson-comments-title">
        <MessageSquare size={16} /> Comentários {comentarios.length > 0 && <span className="lesson-comments-count">({comentarios.length})</span>}
      </h2>

      <div className="lesson-comment-form">
        <textarea
          value={texto}
          maxLength={LIMITE_CARACTERES}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar(); }}
          placeholder="Tire uma dúvida ou compartilhe algo sobre esta aula..."
          aria-label="Escreva um comentário"
        />
        <div className="lesson-comment-form-footer">
          <small>Ctrl + Enter para enviar · {texto.length}/{LIMITE_CARACTERES}</small>
          <button className="lesson-comment-send" type="button" onClick={enviar} disabled={!texto.trim() || enviando}>
            <Send size={13} /> {enviando ? "Enviando..." : "Comentar"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="lesson-comments-empty">Carregando comentários...</div>
      ) : comentarios.length === 0 ? (
        <div className="lesson-comments-empty">Nenhum comentário ainda. Seja o primeiro a comentar.</div>
      ) : (
        <div className="lesson-comment-list">
          {comentarios.map((c) => {
            const meu = c.user_id === userId;
            return (
              <article className="lesson-comment-item" key={c.id}>
                <div className="lesson-comment-avatar">{c.autorFoto ? <img src={c.autorFoto} alt="" /> : initials(c.autor)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="lesson-comment-head">
                    <span className="lesson-comment-author">{c.autor}</span>
                    {meu && <span className="lesson-comment-you">Você</span>}
                    <span className="lesson-comment-time">{timeAgo(c.created_at)}</span>
                    {meu && (
                      <button className="lesson-comment-delete" type="button" onClick={() => excluir(c.id)} aria-label="Excluir comentário" title="Excluir comentário">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="lesson-comment-text">{c.conteudo}</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
