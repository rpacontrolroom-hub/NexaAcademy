import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { theme as palette } from "@/styles/theme";
import { Clock, Eye, Link2, Play, PlusCircle, Search, Trash2, Video, Youtube, X } from "lucide-react";
import { keys, useAulasDoTreinamento, useVideos } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";
import { formatSeconds, parseClock, youtubeId } from "@/lib/format";

const videoCss = `
  .admin-video-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-bottom:1px solid #e7e7e7; }
  .admin-video-search { width:min(340px,100%); min-height:38px; display:flex; align-items:center; gap:9px; padding:0 11px; border:1px solid #ddd; border-radius:8px; background:#fff; color:#777; }
  .admin-video-search input { width:100%; border:0; outline:0; background:transparent; font:400 12.5px Inter,sans-serif; color:#111; }
  .admin-video-thumb { width:82px; aspect-ratio:16/9; border-radius:7px; background:linear-gradient(145deg,#252525,#050505) center/cover; display:grid; place-items:center; color:#fff; flex-shrink:0; }
  .admin-video-status { display:inline-flex; align-items:center; min-height:25px; padding:0 9px; border:1px solid #d9d9d9; border-radius:999px; background:#fff; color:#444; font-size:10.5px; }
  .admin-video-status.draft { background:#f2f2f2; color:#777; }
  .admin-video-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .admin-video-preview { aspect-ratio:16/9; display:grid; place-items:center; overflow:hidden; border:1px solid #d8d8d8; border-radius:10px; background:linear-gradient(145deg,#222,#050505); color:#fff; text-align:center; }
  .admin-video-preview img { width:100%; height:100%; object-fit:cover; }
  @media (max-width:700px) { .admin-video-form { grid-template-columns:1fr; } .admin-video-toolbar { align-items:stretch; flex-direction:column; } }
`;

interface AdminVideosViewProps {
  trainings: { id: string; title: string }[];
}

const formInicial = { youtubeUrl: "", titulo: "", treinamentoId: "", aulaId: "", duracao: "", status: "publicado" as "publicado" | "rascunho" };

function formatarTotal(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function AdminVideosView({ trainings }: AdminVideosViewProps) {
  const queryClient = useQueryClient();
  const { data: videos = [] } = useVideos();
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [form, setForm] = useState(formInicial);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { data: aulas = [] } = useAulasDoTreinamento(form.treinamentoId || null);

  const publicados = videos.filter((v) => v.status === "publicado");
  const termo = busca.trim().toLowerCase();
  const lista = videos.filter((v) => {
    if (filtro === "Publicados" && v.status !== "publicado") return false;
    if (filtro === "Rascunhos" && v.status !== "rascunho") return false;
    return !termo || v.titulo.toLowerCase().includes(termo) || v.curso.toLowerCase().includes(termo);
  });

  const idPrevia = youtubeId(form.youtubeUrl);
  const duracaoSegundos = parseClock(form.duracao);
  const erros = {
    youtubeUrl: !idPrevia ? "Informe um link válido do YouTube." : null,
    titulo: form.titulo.trim().length < 3 ? "Informe o título do vídeo." : null,
    treinamentoId: !form.treinamentoId ? "Selecione o treinamento." : null,
    duracao: duracaoSegundos === null ? 'Use o formato "mm:ss".' : null,
  };
  const valido = Object.values(erros).every((e) => !e);

  function abrir() {
    setForm(formInicial);
    setTentou(false);
    setShowModal(true);
  }

  async function salvar() {
    setTentou(true);
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      await repo.salvarVideo({
        titulo: form.titulo.trim(),
        youtube_url: form.youtubeUrl.trim(),
        treinamento_id: form.treinamentoId,
        aula_id: form.aulaId || null,
        duracao_segundos: duracaoSegundos ?? 0,
        status: form.status,
      });
      toast.success("Vídeo salvo");
      queryClient.invalidateQueries({ queryKey: keys.videos });
      queryClient.invalidateQueries({ queryKey: keys.logs });
      queryClient.invalidateQueries({ queryKey: ["conteudo"] });
      setShowModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string, titulo: string) {
    if (!window.confirm(`Excluir o vídeo "${titulo}"?`)) return;
    try {
      await repo.excluirVideo(id);
      toast.success("Vídeo excluído");
      queryClient.invalidateQueries({ queryKey: keys.videos });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const erro = (campo: keyof typeof erros) => tentou && erros[campo] ? <small style={{ color: "#c2414f" }}>{erros[campo]}</small> : null;

  return (
    <>
      <style>{videoCss}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <div>
          <h1 className="nexa-heading" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Vídeos</h1>
          <p style={{ margin: "4px 0 0", color: palette.textMuted, fontSize: 13 }}>Organize os vídeos do YouTube utilizados nas aulas.</p>
        </div>
        <button className="nexa-btn-primary" type="button" onClick={abrir}><PlusCircle size={15} /> Adicionar vídeo</button>
      </div>

      <div className="nexa-grid-3" style={{ marginBottom: 18 }}>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: palette.textMuted, fontSize: 12 }}><Video size={15} /> Vídeos cadastrados</div><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>{videos.length}</strong></div>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: palette.textMuted, fontSize: 12 }}><Clock size={15} /> Conteúdo publicado</div><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>{formatarTotal(publicados.reduce((s, v) => s + v.duracao_segundos, 0))}</strong></div>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: palette.textMuted, fontSize: 12 }}><Eye size={15} /> Visualizações</div><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>{videos.reduce((s, v) => s + v.visualizacoes, 0).toLocaleString("pt-BR")}</strong></div>
      </div>

      <div className="nexa-card" style={{ overflow: "hidden" }}>
        <div className="admin-video-toolbar">
          <div className="admin-video-search"><Search size={15} /><input placeholder="Buscar por vídeo ou curso..." value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
          <select className="nexa-input" style={{ width: 150 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}><option>Todos</option><option>Publicados</option><option>Rascunhos</option></select>
        </div>
        <div style={{ overflowX: "auto", padding: "14px 18px 4px" }}>
          <table className="nexa-table">
            <thead><tr><th>Vídeo</th><th>Curso e aula</th><th>Duração</th><th>Visualizações</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {lista.length === 0 && (
                <tr><td colSpan={6} style={{ color: palette.textMuted, textAlign: "center", padding: 24 }}>Nenhum vídeo encontrado.</td></tr>
              )}
              {lista.map((item) => {
                const vid = youtubeId(item.youtube_url);
                return (
                  <tr key={item.id}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 11 }}><div className="admin-video-thumb" style={vid ? { backgroundImage: `url(https://img.youtube.com/vi/${vid}/mqdefault.jpg)` } : undefined}>{!vid && <Play size={18} fill="currentColor" />}</div><div><strong style={{ display: "block", fontSize: 12.5 }}>{item.titulo}</strong>{item.youtube_url ? <a href={item.youtube_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: palette.textFaint, fontSize: 10.5 }}><Youtube size={12} /> YouTube</a> : <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: palette.textFaint, fontSize: 10.5 }}><Youtube size={12} /> Sem link</span>}</div></div></td>
                    <td><div style={{ fontSize: 12 }}>{item.curso}</div><div style={{ marginTop: 3, color: palette.textFaint, fontSize: 10.5 }}>{item.aula}</div></td>
                    <td>{formatSeconds(item.duracao_segundos)}</td>
                    <td>{item.visualizacoes}</td>
                    <td><span className={`admin-video-status ${item.status === "rascunho" ? "draft" : ""}`}>{item.status === "rascunho" ? "Rascunho" : "Publicado"}</span></td>
                    <td><button type="button" title="Excluir" onClick={() => excluir(item.id, item.titulo)} style={{ border: 0, background: "transparent", cursor: "pointer", padding: 5 }}><Trash2 size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75 }} onClick={() => setShowModal(false)}>
          <div className="nexa-card nexa-scroll" style={{ width: "min(720px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: 22 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div><div className="nexa-section-title">Adicionar vídeo do YouTube</div><div style={{ marginTop: 4, color: palette.textFaint, fontSize: 11.5 }}>Vincule um vídeo a um treinamento e, se quiser, a uma aula. Vídeos publicados passam a tocar na aula.</div></div>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <div className="admin-video-form">
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">URL do YouTube</span><div style={{ position: "relative" }}><Link2 size={15} style={{ position: "absolute", left: 11, top: 11, color: "#777" }} /><input className="nexa-input" style={{ paddingLeft: 34 }} placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} /></div>{erro("youtubeUrl")}</label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Título do vídeo</span><input className="nexa-input" placeholder="Ex: Introdução ao módulo avançado" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />{erro("titulo")}</label>
              <label><span className="nexa-label">Treinamento</span><select className="nexa-input" value={form.treinamentoId} onChange={(e) => setForm({ ...form, treinamentoId: e.target.value, aulaId: "" })}><option value="" disabled>Selecionar curso</option>{trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>{erro("treinamentoId")}</label>
              <label><span className="nexa-label">Aula (opcional)</span><select className="nexa-input" value={form.aulaId} onChange={(e) => setForm({ ...form, aulaId: e.target.value })} disabled={!form.treinamentoId}><option value="">{aulas.length ? "Sem aula vinculada" : "Nenhuma aula cadastrada"}</option>{aulas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
              <label><span className="nexa-label">Duração</span><input className="nexa-input" placeholder="00:00" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} />{erro("duracao")}</label>
              <label><span className="nexa-label">Status</span><select className="nexa-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}><option value="publicado">Publicado</option><option value="rascunho">Rascunho</option></select></label>
              <div style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Prévia</span><div className="admin-video-preview">{idPrevia ? <img src={`https://img.youtube.com/vi/${idPrevia}/hqdefault.jpg`} alt="Miniatura do vídeo" /> : <div><span style={{ width: 52, height: 52, display: "grid", placeItems: "center", margin: "0 auto 9px", border: "1px solid #555", borderRadius: "50%" }}><Play size={21} /></span><strong style={{ display: "block", fontSize: 12.5 }}>Prévia do vídeo</strong><small style={{ color: "#aaa" }}>A miniatura do YouTube será exibida aqui</small></div>}</div></div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="nexa-btn-primary" type="button" onClick={salvar} disabled={salvando}><Video size={14} /> {salvando ? "Salvando..." : "Salvar vídeo"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
