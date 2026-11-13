import { useState } from "react";
import { theme as palette } from "@/styles/theme";
import { MINIMUM_CERTIFICATE_SCORE } from "@/services/certificate-service";
import { Award, Download, Eye } from "lucide-react";

interface AdminCertificatesViewProps {
  trainings: { id: string; title: string }[];
  onPreview: (trainingId: string) => void;
}

/** Todos os certificados seguem um modelo único; aqui o admin só confere como ficam. */
export default function AdminCertificatesView({ trainings, onPreview }: AdminCertificatesViewProps) {
  const [trainingId, setTrainingId] = useState("");
  const selected = trainingId || trainings[0]?.id || "";

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <h1 className="nexa-heading" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Certificados</h1>
        <p style={{ margin: "4px 0 0", color: palette.textMuted, fontSize: 13 }}>Todos os treinamentos usam o mesmo modelo de certificado.</p>
      </div>

      <div className="nexa-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 9, background: "#004B85", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}><Award size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nexa-section-title">Modelo padrão</div>
            <div style={{ marginTop: 3, color: palette.textFaint, fontSize: 12 }}>
              Nome do aluno, treinamento, carga horária, data, aproveitamento e conteúdo programático (os módulos) entram sozinhos.
              Emitido com {MINIMUM_CERTIFICATE_SCORE}% ou mais de aproveitamento e 100% de progresso.
            </div>
          </div>
          <a className="nexa-btn-ghost" href="/certificates/modelo-certificado-base.pptx" download="Modelo de certificado.pptx"><Download size={14} /> Baixar modelo</a>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ flex: "1 1 280px" }}>
            <span className="nexa-label">Ver como fica para o treinamento</span>
            <select className="nexa-input" value={selected} onChange={(event) => setTrainingId(event.target.value)}>
              {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
          <button className="nexa-btn-primary" type="button" disabled={!selected} onClick={() => onPreview(selected)}><Eye size={14} /> Visualizar</button>
        </div>
      </div>
    </>
  );
}
