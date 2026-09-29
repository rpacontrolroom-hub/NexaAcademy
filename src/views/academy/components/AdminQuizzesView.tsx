import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { theme as palette } from "@/styles/theme";
import { ArrowDown, ArrowUp, CheckCircle2, HelpCircle, Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
import { keys, useAulasDoTreinamento, useQuizzesAdmin } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";

const quizCss = `
  .admin-quiz-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-bottom:1px solid #e7e7e7; }
  .admin-quiz-search { width:min(340px,100%); min-height:38px; display:flex; align-items:center; gap:9px; padding:0 11px; border:1px solid #ddd; border-radius:8px; background:#fff; color:#777; }
  .admin-quiz-search input { width:100%; border:0; outline:0; background:transparent; font:400 12.5px Inter,sans-serif; color:#111; }
  .admin-quiz-status { display:inline-flex; align-items:center; min-height:25px; padding:0 9px; border:1px solid #d9d9d9; border-radius:999px; background:#fff; color:#444; font-size:10.5px; }
  .admin-quiz-status.draft { background:#f2f2f2; color:#777; }
  .admin-quiz-icon { border:0; background:transparent; cursor:pointer; padding:5px; color:#111; }
  .admin-quiz-icon:disabled { opacity:.3; cursor:not-allowed; }
  .admin-quiz-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .admin-quiz-pergunta { padding:12px; border:1px solid #e4e4e4; border-radius:10px; background:#fafafa; }
  .admin-quiz-pergunta-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; font-size:12px; font-weight:700; color:#333; }
  .admin-quiz-alt { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:8px; margin-top:6px; }
  .admin-quiz-alt label { display:flex; align-items:center; gap:5px; font-size:11px; color:#555; cursor:pointer; white-space:nowrap; }
  .admin-quiz-alt.correta input[type=text] { border-color:#2d7147; background:#f1f8f4; }
  @media (max-width:700px) { .admin-quiz-form { grid-template-columns:1fr; } .admin-quiz-toolbar { align-items:stretch; flex-direction:column; } }
`;

interface AdminQuizzesViewProps {
  trainings: { id: string; title: string }[];
}

type PerguntaForm = repo.QuizPerguntaAdmin;

const novaPergunta = (): PerguntaForm => ({ enunciado: "", alternativas: [{ texto: "", correta: true }, { texto: "", correta: false }] });

const formInicial = {
  id: "", titulo: "", treinamentoId: "", aulaId: "", notaMinima: "90", maxTentativas: "",
  status: "publicado" as "publicado" | "rascunho", perguntas: [novaPergunta()],
};

const MAX_ALTERNATIVAS = 6;

export default function AdminQuizzesView({ trainings }: AdminQuizzesViewProps) {
  const queryClient = useQueryClient();
  const { data: quizzes = [] } = useQuizzesAdmin();
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(formInicial);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { data: aulas = [] } = useAulasDoTreinamento(form.treinamentoId || null);

  const termo = busca.trim().toLowerCase();
  const lista = quizzes.filter((q) => !termo || q.titulo.toLowerCase().includes(termo) || q.treinamento.toLowerCase().includes(termo));

  const nota = Number(form.notaMinima.replace(",", "."));
  const tentativas = form.maxTentativas.trim() ? Number(form.maxTentativas) : null;
  const erroPergunta = form.perguntas.length === 0
    ? "Adicione pelo menos uma pergunta."
    : form.perguntas.some((p) => !p.enunciado.trim()) ? "Toda pergunta precisa de enunciado."
    : form.perguntas.some((p) => p.alternativas.filter((a) => a.texto.trim()).length < 2) ? "Cada pergunta precisa de pelo menos 2 alternativas preenchidas."
    : form.perguntas.some((p) => p.alternativas.filter((a) => a.correta && a.texto.trim()).length !== 1) ? "Marque a alternativa correta de cada pergunta."
    : null;
  const erros = {
    titulo: form.titulo.trim().length < 3 ? "Informe o título do quiz." : null,
    treinamentoId: !form.treinamentoId ? "Selecione o treinamento." : null,
    notaMinima: !(nota >= 0 && nota <= 100) ? "Use um valor entre 0 e 100." : null,
    maxTentativas: tentativas !== null && !(Number.isInteger(tentativas) && tentativas >= 1) ? "Use um número inteiro (ou deixe vazio)." : null,
    perguntas: erroPergunta,
  };
  const valido = Object.values(erros).every((e) => !e);

  function abrirNovo() {
    setForm({ ...formInicial, perguntas: [novaPergunta()] });
    setTentou(false);
    setShowModal(true);
  }

  function abrirEdicao(q: repo.QuizAdmin) {
    setForm({
      id: q.id, titulo: q.titulo, treinamentoId: q.treinamento_id ?? "", aulaId: q.aula_id ?? "",
      notaMinima: String(q.nota_minima), maxTentativas: q.max_tentativas ? String(q.max_tentativas) : "",
      status: q.status, perguntas: q.perguntas.length ? q.perguntas.map((p) => ({ ...p, alternativas: p.alternativas.map((a) => ({ ...a })) })) : [novaPergunta()],
    });
    setTentou(false);
    setShowModal(true);
  }

  function alterarPergunta(i: number, patch: Partial<PerguntaForm>) {
    setForm((f) => ({ ...f, perguntas: f.perguntas.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  }

  function moverPergunta(i: number, dir: -1 | 1) {
    setForm((f) => {
      const perguntas = [...f.perguntas];
      [perguntas[i], perguntas[i + dir]] = [perguntas[i + dir], perguntas[i]];
      return { ...f, perguntas };
    });
  }

  function alterarAlternativa(i: number, j: number, texto: string) {
    alterarPergunta(i, { alternativas: form.perguntas[i].alternativas.map((a, k) => (k === j ? { ...a, texto } : a)) });
  }

  function marcarCorreta(i: number, j: number) {
    alterarPergunta(i, { alternativas: form.perguntas[i].alternativas.map((a, k) => ({ ...a, correta: k === j })) });
  }

  function adicionarAlternativa(i: number) {
    alterarPergunta(i, { alternativas: [...form.perguntas[i].alternativas, { texto: "", correta: false }] });
  }

  function removerAlternativa(i: number, j: number) {
    const restantes = form.perguntas[i].alternativas.filter((_, k) => k !== j);
    // Se a removida era a correta, a primeira passa a ser a correta.
    if (!restantes.some((a) => a.correta) && restantes[0]) restantes[0] = { ...restantes[0], correta: true };
    alterarPergunta(i, { alternativas: restantes });
  }

  async function salvar() {
    setTentou(true);
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      await repo.salvarQuiz({
        id: form.id || undefined,
        titulo: form.titulo,
        treinamento_id: form.treinamentoId,
        aula_id: form.aulaId || null,
        nota_minima: nota,
        max_tentativas: tentativas,
        status: form.status,
        perguntas: form.perguntas.map((p) => ({ enunciado: p.enunciado, alternativas: p.alternativas.filter((a) => a.texto.trim()) })),
      });
      toast.success(form.id ? "Quiz atualizado" : "Quiz criado");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(q: repo.QuizAdmin) {
    if (!window.confirm(`Excluir o quiz "${q.titulo}"? As tentativas dos alunos também serão removidas.`)) return;
    try {
      await repo.excluirQuiz(q.id);
      toast.success("Quiz excluído");
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const erro = (campo: keyof typeof erros) => tentou && erros[campo] ? <small style={{ color: "#c2414f" }}>{erros[campo]}</small> : null;

  return (
    <>
      <style>{quizCss}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <div>
          <h1 className="nexa-heading" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Quizzes</h1>
          <p style={{ margin: "4px 0 0", color: palette.textMuted, fontSize: 13 }}>Avaliações corrigidas automaticamente. A nota compõe o aproveitamento do certificado.</p>
        </div>
        <button className="nexa-btn-primary" type="button" onClick={abrirNovo}><PlusCircle size={15} /> Novo quiz</button>
      </div>

      <div className="nexa-card" style={{ overflow: "hidden" }}>
        <div className="admin-quiz-toolbar">
          <div className="admin-quiz-search"><Search size={15} /><input placeholder="Buscar por quiz ou treinamento..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
          <span style={{ color: palette.textMuted, fontSize: 12 }}>{quizzes.length} {quizzes.length === 1 ? "quiz cadastrado" : "quizzes cadastrados"}</span>
        </div>
        <div style={{ overflowX: "auto", padding: "14px 18px 4px" }}>
          <table className="nexa-table">
            <thead><tr><th>Quiz</th><th>Onde aparece</th><th>Perguntas</th><th>Nota mínima</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {lista.length === 0 && <tr><td colSpan={6} style={{ color: palette.textMuted, textAlign: "center", padding: 24 }}>Nenhum quiz encontrado.</td></tr>}
              {lista.map((q) => (
                <tr key={q.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><HelpCircle size={16} /><strong style={{ fontSize: 12.5 }}>{q.titulo}</strong></div></td>
                  <td><div style={{ fontSize: 12 }}>{q.treinamento}</div><div style={{ marginTop: 3, color: palette.textFaint, fontSize: 10.5 }}>{q.aula ? `Aula: ${q.aula}` : "Avaliação final do treinamento"}</div></td>
                  <td>{q.perguntas.length}</td>
                  <td>{q.nota_minima}%{q.max_tentativas ? <div style={{ color: palette.textFaint, fontSize: 10.5 }}>{q.max_tentativas} tentativa(s)</div> : null}</td>
                  <td><span className={`admin-quiz-status ${q.status === "rascunho" ? "draft" : ""}`}>{q.status === "rascunho" ? "Rascunho" : "Publicado"}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="admin-quiz-icon" type="button" title="Editar" onClick={() => abrirEdicao(q)}><Pencil size={15} /></button>
                    <button className="admin-quiz-icon" type="button" title="Excluir" onClick={() => excluir(q)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75 }} onClick={() => setShowModal(false)}>
          <div className="nexa-card nexa-scroll" style={{ width: "min(780px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: 22 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div className="nexa-section-title">{form.id ? "Editar quiz" : "Novo quiz"}</div>
                <div style={{ marginTop: 4, color: palette.textFaint, fontSize: 11.5 }}>Ligado a uma aula, aparece dentro dela. Sem aula, vira a avaliação final do treinamento.</div>
              </div>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <div className="admin-quiz-form">
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Título</span><input className="nexa-input" placeholder="Ex: Avaliação do módulo 1" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />{erro("titulo")}</label>
              <label><span className="nexa-label">Treinamento</span><select className="nexa-input" value={form.treinamentoId} onChange={(e) => setForm({ ...form, treinamentoId: e.target.value, aulaId: "" })}><option value="" disabled>Selecionar treinamento</option>{trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>{erro("treinamentoId")}</label>
              <label><span className="nexa-label">Aula (opcional)</span><select className="nexa-input" value={form.aulaId} onChange={(e) => setForm({ ...form, aulaId: e.target.value })} disabled={!form.treinamentoId}><option value="">Avaliação final (sem aula)</option>{aulas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
              <label><span className="nexa-label">Nota mínima para aprovar (%)</span><input className="nexa-input" inputMode="decimal" value={form.notaMinima} onChange={(e) => setForm({ ...form, notaMinima: e.target.value })} />{erro("notaMinima")}</label>
              <label><span className="nexa-label">Limite de tentativas</span><input className="nexa-input" inputMode="numeric" placeholder="Vazio = ilimitado" value={form.maxTentativas} onChange={(e) => setForm({ ...form, maxTentativas: e.target.value })} />{erro("maxTentativas")}</label>
              <label><span className="nexa-label">Status</span><select className="nexa-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}><option value="publicado">Publicado (aparece para os alunos)</option><option value="rascunho">Rascunho (oculto)</option></select></label>

              <div style={{ gridColumn: "1 / -1" }}>
                <span className="nexa-label">Perguntas</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.perguntas.map((p, i) => (
                    <div className="admin-quiz-pergunta" key={i}>
                      <div className="admin-quiz-pergunta-head">
                        <span>Pergunta {i + 1}</span>
                        <span>
                          <button className="admin-quiz-icon" type="button" title="Subir" disabled={i === 0} onClick={() => moverPergunta(i, -1)}><ArrowUp size={14} /></button>
                          <button className="admin-quiz-icon" type="button" title="Descer" disabled={i === form.perguntas.length - 1} onClick={() => moverPergunta(i, 1)}><ArrowDown size={14} /></button>
                          <button className="admin-quiz-icon" type="button" title="Remover pergunta" disabled={form.perguntas.length === 1} onClick={() => setForm((f) => ({ ...f, perguntas: f.perguntas.filter((_, j) => j !== i) }))}><Trash2 size={14} /></button>
                        </span>
                      </div>
                      <textarea className="nexa-input" rows={2} style={{ resize: "vertical", minHeight: 52 }} placeholder="Enunciado da pergunta" value={p.enunciado} onChange={(e) => alterarPergunta(i, { enunciado: e.target.value })} />
                      {p.alternativas.map((a, j) => (
                        <div className={`admin-quiz-alt ${a.correta ? "correta" : ""}`} key={j}>
                          <label title="Marcar como correta">
                            <input type="radio" name={`correta-${i}`} checked={a.correta} onChange={() => marcarCorreta(i, j)} />
                            {a.correta ? <CheckCircle2 size={13} color="#2d7147" /> : null} Correta
                          </label>
                          <input type="text" className="nexa-input" placeholder={`Alternativa ${String.fromCharCode(65 + j)}`} value={a.texto} onChange={(e) => alterarAlternativa(i, j, e.target.value)} />
                          <button className="admin-quiz-icon" type="button" title="Remover alternativa" disabled={p.alternativas.length <= 2} onClick={() => removerAlternativa(i, j)}><X size={14} /></button>
                        </div>
                      ))}
                      {p.alternativas.length < MAX_ALTERNATIVAS && (
                        <button type="button" onClick={() => adicionarAlternativa(i)} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, padding: 0, border: 0, background: "transparent", color: palette.textMuted, fontSize: 11.5, cursor: "pointer" }}>
                          <PlusCircle size={12} /> Adicionar alternativa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="nexa-btn-ghost" type="button" style={{ marginTop: 10 }} onClick={() => setForm((f) => ({ ...f, perguntas: [...f.perguntas, novaPergunta()] }))}><PlusCircle size={14} /> Adicionar pergunta</button>
                <div>{erro("perguntas")}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="nexa-btn-primary" type="button" onClick={salvar} disabled={salvando}><HelpCircle size={14} /> {salvando ? "Salvando..." : form.id ? "Salvar alterações" : "Criar quiz"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
