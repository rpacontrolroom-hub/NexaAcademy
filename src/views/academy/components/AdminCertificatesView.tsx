import { useMemo, useState } from "react";
import type { CertificateTemplate, CertificateTemplateDraft } from "@/models/certificate";
import { academyController } from "@/controllers/academy-controller";
import { theme as palette } from "@/styles/theme";
import { Award, Download, Eye, FileUp, PlusCircle, Power, Trash2, X } from "lucide-react";

interface AdminCertificatesViewProps {
  courseTitles: string[];
  templates: CertificateTemplate[];
  onCreate: (draft: CertificateTemplateDraft) => boolean;
  onPreview: (template: CertificateTemplate) => void;
  onRemove: (templateId: string) => void;
  onToggleStatus: (templateId: string) => void;
}

function initialDraft(courseTitle: string): CertificateTemplateDraft {
  return {
    name: courseTitle ? `Certificado — ${courseTitle}` : "",
    courseTitle,
    typeLabel: "DE CONCLUSÃO",
    accentColor: "#0B5275",
    minimumScore: 90,
    signerName: "Rael P. Borges",
    signerRole: "Coordenador de CoE RPA, Agentic AI & Processos AZZAS",
    programContent: ["Conteúdo introdutório", "Conceitos fundamentais", "Aplicação prática", "Boas práticas"],
    sourceFileName: "Template Certificados da Área - RPA Developer 2.pptx",
    sourceFileUrl: "/certificates/modelo-certificado-base.pptx",
    status: "active",
  };
}

export default function AdminCertificatesView({
  courseTitles,
  templates,
  onCreate,
  onPreview,
  onRemove,
  onToggleStatus,
}: AdminCertificatesViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const firstCourse = courseTitles[0] ?? "";
  const [draft, setDraft] = useState<CertificateTemplateDraft>(() => initialDraft(firstCourse));
  const validation = academyController.validateCertificateTemplateDraft(draft);
  const activeCount = templates.filter((template) => template.status === "active").length;
  const coveredCourses = useMemo(() => new Set(templates.map((template) => template.courseTitle)).size, [templates]);

  function openModal() {
    setDraft(initialDraft(firstCourse));
    setAttempted(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setAttempted(false);
  }

  function submit() {
    setAttempted(true);
    if (!validation.valid) return;
    if (onCreate(draft)) closeModal();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginBottom: 18 }}>
        <div>
          <h1 className="nexa-heading" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Certificados</h1>
          <p style={{ margin: "4px 0 0", color: palette.textMuted, fontSize: 13 }}>Gerencie o modelo específico emitido para cada curso.</p>
        </div>
        <button className="nexa-btn-primary" type="button" onClick={openModal}><PlusCircle size={15} /> Novo certificado</button>
      </div>

      <div className="nexa-grid-3" style={{ marginBottom: 18 }}>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ color: palette.textMuted, fontSize: 12 }}>Modelos cadastrados</div><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{templates.length}</strong></div>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ color: palette.textMuted, fontSize: 12 }}>Modelos ativos</div><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{activeCount}</strong></div>
        <div className="nexa-card" style={{ padding: 18 }}><div style={{ color: palette.textMuted, fontSize: 12 }}>Cursos com certificado</div><strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>{coveredCourses}</strong></div>
      </div>

      <div className="nexa-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${palette.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="nexa-section-title">Modelos por curso</div>
            <div style={{ marginTop: 3, color: palette.textFaint, fontSize: 11.5 }}>Baseados no arquivo Template Certificados da Área - RPA Developer 2.pptx</div>
          </div>
          <a className="nexa-btn-ghost" href="/certificates/modelo-certificado-base.pptx" download><Download size={14} /> Baixar modelo-base</a>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="nexa-table">
            <thead><tr><th>Modelo</th><th>Curso vinculado</th><th>Tipo</th><th>Nota mínima</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 8, background: template.accentColor, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}><Award size={16} /></span>
                      <div><strong style={{ display: "block", fontSize: 12.5 }}>{template.name}</strong>{template.sourceFileUrl ? <a href={template.sourceFileUrl} download={template.sourceFileName} style={{ color: palette.textFaint, fontSize: 10.5, textDecoration: "underline" }}>{template.sourceFileName}</a> : <span style={{ color: palette.textFaint, fontSize: 10.5 }}>{template.sourceFileName}</span>}</div>
                    </div>
                  </td>
                  <td style={{ color: palette.textMuted }}>{template.courseTitle}</td>
                  <td>{template.typeLabel}</td>
                  <td>{template.minimumScore}%</td>
                  <td><span className="nexa-status-dot" style={{ background: template.status === "active" ? palette.green : palette.textFaint }} />{template.status === "active" ? "Ativo" : "Rascunho"}</td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
                      <button className="nexa-btn-ghost" type="button" onClick={() => onPreview(template)} title="Visualizar"><Eye size={14} /></button>
                      <button className="nexa-btn-ghost" type="button" onClick={() => onToggleStatus(template.id)} title="Alterar status"><Power size={14} /></button>
                      <button className="nexa-btn-ghost" type="button" onClick={() => onRemove(template.id)} title="Excluir"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75 }} onClick={closeModal}>
          <div className="nexa-card nexa-scroll" style={{ width: "min(680px, calc(100vw - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto", padding: 22 }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div><div className="nexa-section-title">Novo modelo de certificado</div><div style={{ marginTop: 4, color: palette.textFaint, fontSize: 11.5 }}>Vincule um modelo a um curso da plataforma.</div></div>
              <button className="nexa-btn-ghost" type="button" onClick={closeModal}><X size={15} /></button>
            </div>

            <div className="admin-certificate-form">
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Curso</span><select className="nexa-input" value={draft.courseTitle} onChange={(event) => { const courseTitle = event.target.value; setDraft((current) => ({ ...current, courseTitle, name: current.name || `Certificado — ${courseTitle}` })); }}>{courseTitles.map((title) => <option key={title} value={title}>{title}</option>)}</select>{attempted && validation.errors.courseTitle && <small style={{ color: "#c2414f" }}>{validation.errors.courseTitle}</small>}</label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Nome do modelo</span><input className="nexa-input" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />{attempted && validation.errors.name && <small style={{ color: "#c2414f" }}>{validation.errors.name}</small>}</label>
              <label><span className="nexa-label">Tipo exibido</span><input className="nexa-input" value={draft.typeLabel} onChange={(event) => setDraft({ ...draft, typeLabel: event.target.value })} placeholder="DE CONCLUSÃO" />{attempted && validation.errors.typeLabel && <small style={{ color: "#c2414f" }}>{validation.errors.typeLabel}</small>}</label>
              <label><span className="nexa-label">Nota mínima</span><input className="nexa-input" type="number" min={0} max={100} value={draft.minimumScore} onChange={(event) => setDraft({ ...draft, minimumScore: Number(event.target.value) })} />{attempted && validation.errors.minimumScore && <small style={{ color: "#c2414f" }}>{validation.errors.minimumScore}</small>}</label>
              <label><span className="nexa-label">Cor do curso</span><div style={{ display: "flex", gap: 8 }}><input type="color" value={draft.accentColor} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value.toUpperCase() })} style={{ width: 46, height: 38, border: "1px solid #ddd", borderRadius: 7, padding: 3, background: "#fff" }} /><input className="nexa-input" value={draft.accentColor} onChange={(event) => setDraft({ ...draft, accentColor: event.target.value })} /></div></label>
              <label><span className="nexa-label">Status inicial</span><select className="nexa-input" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CertificateTemplateDraft["status"] })}><option value="active">Ativo</option><option value="draft">Rascunho</option></select></label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Cargo do responsável</span><input className="nexa-input" value={draft.signerRole} onChange={(event) => setDraft({ ...draft, signerRole: event.target.value })} />{attempted && validation.errors.signerRole && <small style={{ color: "#c2414f" }}>{validation.errors.signerRole}</small>}</label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Conteúdo programático — um item por linha</span><textarea className="nexa-input" style={{ minHeight: 100, resize: "vertical" }} value={draft.programContent.join("\n")} onChange={(event) => setDraft({ ...draft, programContent: event.target.value.split("\n") })} />{attempted && validation.errors.programContent && <small style={{ color: "#c2414f" }}>{validation.errors.programContent}</small>}</label>
              <label style={{ gridColumn: "1 / -1" }}><span className="nexa-label">Arquivo do modelo</span><div style={{ border: "1px dashed #cfcfcf", borderRadius: 9, padding: 16, background: "#fafafa" }}><input id="certificate-template-file" type="file" accept=".ppt,.pptx,.pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; if (file) setDraft({ ...draft, sourceFileName: file.name, sourceFileUrl: URL.createObjectURL(file) }); }} /><label htmlFor="certificate-template-file" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}><FileUp size={20} /><span><strong style={{ display: "block", fontSize: 12.5 }}>Selecionar PPTX, PDF ou imagem</strong><small style={{ color: palette.textFaint }}>{draft.sourceFileName}</small></span></label></div></label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 20 }}>
              <button className="nexa-btn-ghost" type="button" onClick={closeModal}>Cancelar</button>
              <button className="nexa-btn-primary" type="button" onClick={submit}><FileUp size={14} /> Adicionar certificado</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
