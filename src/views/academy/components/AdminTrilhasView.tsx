import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { theme as palette } from "@/styles/theme";
import { ArrowDown, ArrowUp, Map, Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
import { keys, useTrilhasAdmin } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";

const trilhaCss = `
  .admin-trilha-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-bottom:1px solid #e7e7e7; }
  .admin-trilha-search { width:min(340px,100%); min-height:38px; display:flex; align-items:center; gap:9px; padding:0 11px; border:1px solid #ddd; border-radius:8px; background:#fff; color:#777; }
  .admin-trilha-search input { width:100%; border:0; outline:0; background:transparent; font:400 12.5px Inter,sans-serif; color:#111; }
  .admin-trilha-status { display:inline-flex; align-items:center; min-height:25px; padding:0 9px; border:1px solid #d9d9d9; border-radius:999px; background:#fff; color:#444; font-size:10.5px; }
  .admin-trilha-status.off { background:#f2f2f2; color:#777; }
  .admin-trilha-icon { border:0; background:transparent; cursor:pointer; padding:5px; color:#111; }
  .admin-trilha-icon:disabled { opacity:.3; cursor:not-allowed; }
  .admin-trilha-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .admin-trilha-etapas { display:flex; flex-direction:column; gap:8px; }
  .admin-trilha-etapa { display:grid; grid-template-columns:26px minmax(0,1fr) minmax(0,1fr) auto; align-items:center; gap:8px; padding:8px 10px; border:1px solid #e4e4e4; border-radius:9px; background:#fafafa; }
  .admin-trilha-etapa-num { font-weight:700; font-size:12px; color:#555; text-align:center; }
  @media (max-width:700px) {
    .admin-trilha-form { grid-template-columns:1fr; }
    .admin-trilha-toolbar { align-items:stretch; flex-direction:column; }
    .admin-trilha-etapa { grid-template-columns:26px minmax(0,1fr) auto; }
    .admin-trilha-etapa > select { grid-column:2 / -1; }
  }
`;

interface AdminTrilhasViewProps {
  trainings: { id: string; title: string }[];
}

interface EtapaForm {
  titulo: string;
  treinamentoId: string;
}

const formInicial = { id: "", titulo: "", descricao: "", status: "ativo" as "ativo" | "inativo", etapas: [] as EtapaForm[] };

export default function AdminTrilhasView({ trainings }: AdminTrilhasViewProps) {
  const queryClient = useQueryClient();
  const { data: trilhas = [] } = useTrilhasAdmin();
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState(formInicial);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const termo = busca.trim().toLowerCase();
  const lista = trilhas.filter((t) => !termo || t.titulo.toLowerCase().includes(termo) || (t.descricao ?? "").toLowerCase().includes(termo));
  const nomeTreinamento = (id: string | null) => trainings.find((t) => t.id === id)?.title;

  const erros = {
    titulo: form.titulo.trim().length < 3 ? "Informe o nome da trilha." : null,
    etapas: form.etapas.length === 0 ? "Adicione pelo menos uma etapa." : form.etapas.some((e) => !e.titulo.trim()) ? "Toda etapa precisa de um título." : null,
  };
  const valido = Object.values(erros).every((e) => !e);

  function abrirNova() {
    setForm({ ...formInicial, etapas: [{ titulo: "", treinamentoId: "" }] });
    setTentou(false);
    setShowModal(true);
  }

  function abrirEdicao(t: repo.TrilhaAdmin) {
    setForm({
      id: t.id,
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      status: t.status,
      etapas: t.etapas.map((e) => ({ titulo: e.titulo, treinamentoId: e.treinamento_id ?? "" })),
    });
    setTentou(false);
    setShowModal(true);
  }

  function alterarEtapa(index: number, patch: Partial<EtapaForm>) {
    setForm((f) => ({ ...f, etapas: f.etapas.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  }

  function escolherTreinamento(index: number, treinamentoId: string) {
    const etapa = form.etapas[index];
    const tituloAnterior = nomeTreinamento(etapa.treinamentoId);
    // Preenche o título com o nome do treinamento, sem sobrescrever um título digitado.
    const titulo = !etapa.titulo.trim() || etapa.titulo === tituloAnterior ? nomeTreinamento(treinamentoId) ?? etapa.titulo : etapa.titulo;
    alterarEtapa(index, { treinamentoId, titulo });
  }

  function moverEtapa(index: number, direcao: -1 | 1) {
    setForm((f) => {
      const etapas = [...f.etapas];
      [etapas[index], etapas[index + direcao]] = [etapas[index + direcao], etapas[index]];
      return { ...f, etapas };
    });
  }

  function removerEtapa(index: number) {
    setForm((f) => ({ ...f, etapas: f.etapas.filter((_, i) => i !== index) }));
  }

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: keys.trilhas });
    queryClient.invalidateQueries({ queryKey: keys.logs });
  }

  async function salvar() {
    setTentou(true);
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      await repo.salvarTrilha({
        id: form.id || undefined,
        titulo: form.titulo,
        descricao: form.descricao,
        status: form.status,
        etapas: form.etapas.map((e) => ({ titulo: e.titulo, treinamento_id: e.treinamentoId || null })),
      });
      toast.success(form.id ? "Trilha atualizada" : "Trilha criada");
      invalidar();
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(t: repo.TrilhaAdmin) {
    if (!window.confirm(`Excluir a trilha "${t.titulo}"? As etapas dela também serão removidas.`)) return;
    try {
      await repo.excluirTrilha(t.id);
      toast.success("Trilha excluída");
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const erro = (campo: keyof typeof erros) => tentou && erros[campo] ? <small style={{ color: "#c2414f" }}>{erros[campo]}</small> : null;

  return (
    <>
      <style>{trilhaCss}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <div>
          <h1 className="nexa-heading" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Trilhas</h1>
          <p style={{ margin: "4px 0 0", color: palette.textMuted, fontSize: 13 }}>Monte sequências de treinamentos para os colaboradores seguirem.</p>
        </div>
        <button className="nexa-btn-primary" type="button" onClick={abrirNova}><PlusCircle size={15} /> Nova trilha</button>
      </div>

      <div className="nexa-card" style={{ overflow: "hidden" }}>
        <div className="admin-trilha-toolbar">
          <div className="admin-trilha-search"><Search size={15} /><input placeholder="Buscar trilha..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
          <span style={{ color: palette.textMuted, fontSize: 12 }}>{trilhas.length} {trilhas.length === 1 ? "trilha cadastrada" : "trilhas cadastradas"}</span>
        </div>
        <div style={{ overflowX: "auto", padding: "14px 18px 4px" }}>
          <table className="nexa-table">
            <thead><tr><th>Trilha</th><th>Etapas</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {lista.length === 0 && (
                <tr><td colSpan={4} style={{ color: palette.textMuted, textAlign: "center", padding: 24 }}>Nenhuma trilha encontrada.</td></tr>
              )}
              {lista.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Map size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: "block", fontSize: 12.5 }}>{t.titulo}</strong>
                        {t.descricao && <div style={{ marginTop: 3, color: palette.textFaint, fontSize: 11, maxWidth: 460 }}>{t.descricao}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{t.etapas.length} {t.etapas.length === 1 ? "etapa" : "etapas"}</div>
                    <div style={{ marginTop: 3, color: palette.textFaint, fontSize: 10.5, maxWidth: 320 }}>{t.etapas.map((e) => e.titulo).join(" → ")}</div>
                  </td>
                  <td><span className={`admin-trilha-status ${t.status === "inativo" ? "off" : ""}`}>{t.status === "inativo" ? "Inativa" : "Ativa"}</span></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="admin-trilha-icon" type="button" title="Editar" onClick={() => abrirEdicao(t)}><Pencil size={15} /></button>
                    <button className="admin-trilha-icon" type="button" title="Excluir" onClick={() => excluir(t)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75 }} onClick={() => setShowModal(false)}>
          <div className="nexa-card nexa-scroll" style={{ width: "min(760px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: 22 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div className="nexa-section-title">{form.id ? "Editar trilha" : "Nova trilha"}</div>
                <div style={{ marginTop: 4, color: palette.textFaint, fontSize: 11.5 }}>Cada etapa pode apontar para um treinamento. A etapa conta como concluída quando o colaborador termina o treinamento.</div>
              </div>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <div className="admin-trilha-form">
              <label><span className="nexa-label">Nome da trilha</span><input className="nexa-input" placeholder="Ex: Onboarding RPA" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />{erro("titulo")}</label>
              <label><span className="nexa-label">Status</span><select className="nexa-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}><option value="ativo">Ativa (aparece no app)</option><option value="inativo">Inativa (oculta no app)</option></select></label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Descrição</span><textarea className="nexa-input" rows={2} style={{ resize: "vertical", minHeight: 60 }} placeholder="Para quem é a trilha e o que ela cobre" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>

              <div style={{ gridColumn: "1 / -1" }}>
                <span className="nexa-label">Etapas</span>
                <div className="admin-trilha-etapas">
                  {form.etapas.map((etapa, i) => (
                    <div className="admin-trilha-etapa" key={i}>
                      <span className="admin-trilha-etapa-num">{i + 1}</span>
                      <input className="nexa-input" placeholder="Título da etapa" value={etapa.titulo} onChange={(e) => alterarEtapa(i, { titulo: e.target.value })} />
                      <select className="nexa-input" value={etapa.treinamentoId} onChange={(e) => escolherTreinamento(i, e.target.value)}>
                        <option value="">Sem treinamento vinculado</option>
                        {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </select>
                      <div style={{ display: "flex", whiteSpace: "nowrap" }}>
                        <button className="admin-trilha-icon" type="button" title="Subir" disabled={i === 0} onClick={() => moverEtapa(i, -1)}><ArrowUp size={14} /></button>
                        <button className="admin-trilha-icon" type="button" title="Descer" disabled={i === form.etapas.length - 1} onClick={() => moverEtapa(i, 1)}><ArrowDown size={14} /></button>
                        <button className="admin-trilha-icon" type="button" title="Remover etapa" onClick={() => removerEtapa(i)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="nexa-btn-ghost" type="button" style={{ marginTop: 10 }} onClick={() => setForm({ ...form, etapas: [...form.etapas, { titulo: "", treinamentoId: "" }] })}><PlusCircle size={14} /> Adicionar etapa</button>
                <div>{erro("etapas")}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="nexa-btn-primary" type="button" onClick={salvar} disabled={salvando}><Map size={14} /> {salvando ? "Salvando..." : form.id ? "Salvar alterações" : "Criar trilha"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
