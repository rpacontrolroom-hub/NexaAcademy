import { useState } from "react";
import { theme as palette } from "@/styles/theme";
import { Clock, Eye, Link2, MoreHorizontal, Play, PlusCircle, Search, Video, Youtube, X } from "lucide-react";

const videos = [
  { title: "Introdução ao módulo avançado", course: "Blue Prism Avançado", lesson: "Módulo 3 · Aula 1", duration: "05:15", status: "Publicado", views: 184 },
  { title: "Work Queues — Tratamento de Exceções", course: "Work Queues na prática", lesson: "Módulo 4 · Aula 2", duration: "10:40", status: "Publicado", views: 126 },
  { title: "Primeiros endpoints com FastAPI", course: "APIs REST com FastAPI", lesson: "Módulo 1 · Aula 3", duration: "12:20", status: "Rascunho", views: 0 },
  { title: "Automação de arquivos com Python", course: "Python para Automação", lesson: "Módulo 2 · Aula 2", duration: "08:45", status: "Publicado", views: 93 },
];

const videoCss = `
  .admin-video-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-bottom:1px solid #e7e7e7; }
  .admin-video-search { width:min(340px,100%); min-height:38px; display:flex; align-items:center; gap:9px; padding:0 11px; border:1px solid #ddd; border-radius:8px; background:#fff; color:#777; }
  .admin-video-search input { width:100%; border:0; outline:0; background:transparent; font:400 12.5px Inter,sans-serif; color:#111; }
  .admin-video-thumb { width:82px; aspect-ratio:16/9; border-radius:7px; background:linear-gradient(145deg,#252525,#050505); display:grid; place-items:center; color:#fff; flex-shrink:0; }
  .admin-video-status { display:inline-flex; align-items:center; min-height:25px; padding:0 9px; border:1px solid #d9d9d9; border-radius:999px; background:#fff; color:#444; font-size:10.5px; }
  .admin-video-status.draft { background:#f2f2f2; color:#777; }
  .admin-video-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .admin-video-preview { aspect-ratio:16/9; display:grid; place-items:center; border:1px solid #d8d8d8; border-radius:10px; background:linear-gradient(145deg,#222,#050505); color:#fff; text-align:center; }
  @media (max-width:700px) { .admin-video-form { grid-template-columns:1fr; } .admin-video-toolbar { align-items:stretch; flex-direction:column; } }
`;

export default function AdminVideosView() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <style>{videoCss}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <div>
          <h1 className="nexa-heading" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Vídeos</h1>
          <p style={{ margin: "4px 0 0", color: palette.textMuted, fontSize: 13 }}>Organize os vídeos do YouTube utilizados nas aulas.</p>
        </div>
        <button className="nexa-btn-primary" type="button" onClick={() => setShowModal(true)}><PlusCircle size={15} /> Adicionar vídeo</button>
      </div>

      <div className="nexa-grid-3" style={{ marginBottom: 18 }}>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: palette.textMuted, fontSize: 12 }}><Video size={15} /> Vídeos cadastrados</div><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>24</strong></div>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: palette.textMuted, fontSize: 12 }}><Clock size={15} /> Conteúdo publicado</div><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>4h 38min</strong></div>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: palette.textMuted, fontSize: 12 }}><Eye size={15} /> Visualizações</div><strong style={{ display: "block", marginTop: 8, fontSize: 24 }}>1.284</strong></div>
      </div>

      <div className="nexa-card" style={{ overflow: "hidden" }}>
        <div className="admin-video-toolbar">
          <div className="admin-video-search"><Search size={15} /><input placeholder="Buscar por vídeo ou curso..." /></div>
          <select className="nexa-input" style={{ width: 150 }} defaultValue="Todos"><option>Todos</option><option>Publicados</option><option>Rascunhos</option></select>
        </div>
        <div style={{ overflowX: "auto", padding: "14px 18px 4px" }}>
          <table className="nexa-table">
            <thead><tr><th>Vídeo</th><th>Curso e aula</th><th>Duração</th><th>Visualizações</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {videos.map((item) => (
                <tr key={item.title}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 11 }}><div className="admin-video-thumb"><Play size={18} fill="currentColor" /></div><div><strong style={{ display: "block", fontSize: 12.5 }}>{item.title}</strong><span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, color: palette.textFaint, fontSize: 10.5 }}><Youtube size={12} /> YouTube</span></div></div></td>
                  <td><div style={{ fontSize: 12 }}>{item.course}</div><div style={{ marginTop: 3, color: palette.textFaint, fontSize: 10.5 }}>{item.lesson}</div></td>
                  <td>{item.duration}</td>
                  <td>{item.views}</td>
                  <td><span className={`admin-video-status ${item.status === "Rascunho" ? "draft" : ""}`}>{item.status}</span></td>
                  <td><button type="button" title="Mais opções" style={{ border: 0, background: "transparent", cursor: "pointer", padding: 5 }}><MoreHorizontal size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75 }} onClick={() => setShowModal(false)}>
          <div className="nexa-card nexa-scroll" style={{ width: "min(720px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: 22 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div><div className="nexa-section-title">Adicionar vídeo do YouTube</div><div style={{ marginTop: 4, color: palette.textFaint, fontSize: 11.5 }}>Protótipo visual para vincular um vídeo a uma aula.</div></div>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}><X size={15} /></button>
            </div>

            <div className="admin-video-form">
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">URL do YouTube</span><div style={{ position: "relative" }}><Link2 size={15} style={{ position: "absolute", left: 11, top: 11, color: "#777" }} /><input className="nexa-input" style={{ paddingLeft: 34 }} placeholder="https://www.youtube.com/watch?v=..." /></div></label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Título do vídeo</span><input className="nexa-input" placeholder="Ex: Introdução ao módulo avançado" /></label>
              <label><span className="nexa-label">Treinamento</span><select className="nexa-input" defaultValue=""><option value="" disabled>Selecionar curso</option><option>Blue Prism Avançado</option><option>Work Queues na prática</option><option>Python para Automação</option><option>APIs REST com FastAPI</option></select></label>
              <label><span className="nexa-label">Aula</span><select className="nexa-input" defaultValue=""><option value="" disabled>Selecionar aula</option><option>Módulo 1 · Aula 1</option><option>Módulo 2 · Aula 2</option><option>Módulo 3 · Aula 1</option></select></label>
              <label><span className="nexa-label">Duração</span><input className="nexa-input" placeholder="00:00" /></label>
              <label><span className="nexa-label">Status</span><select className="nexa-input"><option>Publicado</option><option>Rascunho</option></select></label>
              <div style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Prévia</span><div className="admin-video-preview"><div><span style={{ width: 52, height: 52, display: "grid", placeItems: "center", margin: "0 auto 9px", border: "1px solid #555", borderRadius: "50%" }}><Play size={21} /></span><strong style={{ display: "block", fontSize: 12.5 }}>Prévia do vídeo</strong><small style={{ color: "#aaa" }}>A miniatura do YouTube será exibida aqui</small></div></div></div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
              <button className="nexa-btn-ghost" type="button" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="nexa-btn-primary" type="button" onClick={() => setShowModal(false)}><Video size={14} /> Salvar vídeo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

