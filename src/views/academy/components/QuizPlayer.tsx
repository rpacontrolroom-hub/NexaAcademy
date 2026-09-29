import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import * as repo from "@/data/academy-repository";

const quizCss = `
  .quiz-player { padding:18px 20px; }
  .quiz-player-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
  .quiz-player-title { display:flex; align-items:center; gap:8px; margin:0; font-size:15px; font-weight:700; color:#111; }
  .quiz-player-meta { margin-top:4px; color:#777; font-size:12px; }
  .quiz-result { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:10px; font-size:13px; margin-bottom:14px; }
  .quiz-result.ok { background:#e7f4ec; color:#2d7147; border:1px solid #cfe8d8; }
  .quiz-result.fail { background:#fbeaec; color:#9b2c3a; border:1px solid #f3c9cf; }
  .quiz-question { padding:14px 0; border-top:1px solid #efefef; }
  .quiz-question-title { margin:0 0 10px; color:#111; font-size:13.5px; font-weight:600; line-height:1.45; }
  .quiz-option { display:flex; align-items:flex-start; gap:10px; padding:10px 12px; margin-top:6px; border:1px solid #e3e3e3; border-radius:9px; background:#fff; color:#333; font-size:13px; cursor:pointer; transition:border-color .15s ease, background .15s ease; }
  .quiz-option:hover { border-color:#bbb; }
  .quiz-option.selected { border-color:#111; background:#f6f6f6; }
  .quiz-option input { margin-top:3px; }
  .quiz-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding-top:14px; border-top:1px solid #efefef; }
  .quiz-actions small { color:#888; font-size:11.5px; }
  .quiz-submit { display:flex; align-items:center; gap:7px; min-height:40px; padding:0 16px; border:0; border-radius:7px; background:#111; color:#fff; font:600 12px Inter,sans-serif; cursor:pointer; }
  .quiz-submit:disabled { opacity:.35; cursor:not-allowed; }
  .quiz-retry { display:flex; align-items:center; gap:7px; min-height:36px; padding:0 14px; border:1px solid #ddd; border-radius:7px; background:#fff; color:#111; font:600 12px Inter,sans-serif; cursor:pointer; }
`;

interface QuizPlayerProps {
  quiz: repo.QuizAluno;
  /** Chamado depois de cada tentativa corrigida (para atualizar progresso/certificado). */
  onRespondido?: (resultado: { nota: number; aprovado: boolean }) => void;
}

export default function QuizPlayer({ quiz, onRespondido }: QuizPlayerProps) {
  const queryClient = useQueryClient();
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [refazendo, setRefazendo] = useState(false);

  const melhor = quiz.tentativas.reduce<repo.QuizAluno["tentativas"][number] | null>((m, t) => (!m || t.nota > m.nota ? t : m), null);
  const ultima = quiz.tentativas[0] ?? null;
  const aprovado = quiz.tentativas.some((t) => t.aprovado);
  const restantes = quiz.max_tentativas === null ? null : Math.max(0, quiz.max_tentativas - quiz.tentativas.length);
  const podeResponder = restantes === null || restantes > 0;
  const mostrarFormulario = podeResponder && (quiz.tentativas.length === 0 || refazendo);
  const respondidas = quiz.perguntas.filter((p) => respostas[p.id]).length;

  async function enviar() {
    if (respondidas < quiz.perguntas.length || enviando) return;
    setEnviando(true);
    try {
      const resultado = await repo.responderQuiz(quiz.id, respostas);
      toast[resultado.aprovado ? "success" : "error"](
        resultado.aprovado ? `Aprovado com ${resultado.nota}%!` : `Você fez ${resultado.nota}%. A nota mínima é ${quiz.nota_minima}%.`,
      );
      setRespostas({});
      setRefazendo(false);
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      for (const queryKey of [["matriculas"], ["meu-resumo"], ["meus-certificados"]]) queryClient.invalidateQueries({ queryKey });
      onRespondido?.(resultado);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="quiz-player">
      <style>{quizCss}</style>
      <div className="quiz-player-head">
        <div>
          <h3 className="quiz-player-title"><HelpCircle size={16} /> {quiz.titulo}</h3>
          <div className="quiz-player-meta">
            {quiz.perguntas.length} {quiz.perguntas.length === 1 ? "pergunta" : "perguntas"} · nota mínima {quiz.nota_minima}%
            {restantes !== null && ` · ${restantes} de ${quiz.max_tentativas} tentativa(s) restante(s)`}
          </div>
        </div>
      </div>

      {ultima && !mostrarFormulario && (
        <div className={`quiz-result ${aprovado ? "ok" : "fail"}`}>
          {aprovado ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span style={{ flex: 1 }}>
            {aprovado
              ? <>Aprovado! Sua melhor nota foi <strong>{melhor?.nota}%</strong>.</>
              : <>Última nota: <strong>{ultima.nota}%</strong>. Você precisa de {quiz.nota_minima}% para ser aprovado.</>}
          </span>
          {podeResponder && (
            <button className="quiz-retry" type="button" onClick={() => setRefazendo(true)}>
              <RotateCcw size={13} /> {aprovado ? "Refazer" : "Tentar novamente"}
            </button>
          )}
        </div>
      )}

      {!podeResponder && !aprovado && (
        <div className="quiz-result fail"><XCircle size={18} /> Você usou todas as tentativas deste quiz. Fale com seu líder técnico.</div>
      )}

      {mostrarFormulario && quiz.perguntas.length === 0 && <div style={{ color: "#777", fontSize: 13 }}>Este quiz ainda não tem perguntas.</div>}

      {mostrarFormulario && quiz.perguntas.length > 0 && (
        <>
          {quiz.perguntas.map((p, i) => (
            <fieldset className="quiz-question" key={p.id} style={{ border: 0, margin: 0, padding: "14px 0", borderTop: "1px solid #efefef" }}>
              <legend className="quiz-question-title" style={{ padding: 0, float: "left", width: "100%" }}>{i + 1}. {p.enunciado}</legend>
              <div style={{ clear: "both" }}>
                {p.alternativas.map((a) => (
                  <label key={a.id} className={`quiz-option ${respostas[p.id] === a.id ? "selected" : ""}`}>
                    <input type="radio" name={`quiz-${quiz.id}-${p.id}`} checked={respostas[p.id] === a.id} onChange={() => setRespostas((r) => ({ ...r, [p.id]: a.id }))} />
                    <span>{a.texto}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="quiz-actions">
            <small>{respondidas} de {quiz.perguntas.length} respondidas</small>
            <div style={{ display: "flex", gap: 8 }}>
              {refazendo && <button className="quiz-retry" type="button" onClick={() => { setRefazendo(false); setRespostas({}); }}>Cancelar</button>}
              <button className="quiz-submit" type="button" onClick={enviar} disabled={respondidas < quiz.perguntas.length || enviando}>
                <CheckCircle2 size={14} /> {enviando ? "Corrigindo..." : "Enviar respostas"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
