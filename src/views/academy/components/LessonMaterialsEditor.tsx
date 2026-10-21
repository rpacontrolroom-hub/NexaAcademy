import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Link2, PlusCircle, X } from "lucide-react";
import { theme as palette } from "@/styles/theme";
import { linkValido } from "@/lib/format";
import type { TrainingMaterial } from "@/models/training";

interface LessonMaterialsEditorProps {
  materiais: TrainingMaterial[];
  onChange: (materiais: TrainingMaterial[]) => void;
  titulo?: string;
  descricao?: string;
}

const campo = {
  background: palette.bgPanel, border: `1px solid ${palette.border}`,
  borderRadius: 7, padding: "7px 8px", color: palette.textPrimary, fontSize: 12, outline: "none",
};

export default function LessonMaterialsEditor({ materiais, onChange, titulo = "Materiais da aula", descricao }: LessonMaterialsEditorProps) {
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");
  const podeAdicionar = link.trim().length > 0;

  function adicionar() {
    const url = link.trim();
    if (!linkValido(url)) {
      toast.error("Cole um link completo, começando com https:// (ex.: o link de compartilhamento do Google Drive).");
      return;
    }
    onChange([...materiais, { titulo: nome.trim() || "Material de apoio", arquivoUrl: url }]);
    setNome("");
    setLink("");
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: palette.textPrimary, fontSize: 12, fontWeight: 600, marginBottom: descricao ? 2 : 6 }}>
        <Link2 size={13} /> {titulo}
      </div>
      {descricao && <div style={{ color: palette.textFaint, fontSize: 10.5, marginBottom: 8 }}>{descricao}</div>}

      {materiais.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          {materiais.map((m, i) => (
            <div key={m.id ?? `novo-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                value={m.titulo}
                onChange={(e) => onChange(materiais.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
                aria-label="Nome do material"
                style={{ ...campo, flex: "1 1 130px", minWidth: 0, padding: "5px 8px" }}
              />
              <input
                value={m.arquivoUrl ?? ""}
                onChange={(e) => onChange(materiais.map((x, j) => (j === i ? { ...x, arquivoUrl: e.target.value } : x)))}
                aria-label="Link do material"
                style={{ ...campo, flex: "2 1 180px", minWidth: 0, padding: "5px 8px", borderColor: m.arquivoUrl && !linkValido(m.arquivoUrl) ? "#F2596B" : palette.border }}
              />
              {m.arquivoUrl && linkValido(m.arquivoUrl) && (
                <a href={m.arquivoUrl} target="_blank" rel="noreferrer" aria-label={`Abrir ${m.titulo}`} title="Abrir link" style={{ color: palette.textMuted, display: "flex" }}>
                  <ExternalLink size={13} />
                </a>
              )}
              <button
                type="button"
                onClick={() => onChange(materiais.filter((_, j) => j !== i))}
                style={{ background: "transparent", border: "none", color: palette.textFaint, cursor: "pointer", padding: 2 }}
                aria-label={`Remover ${m.titulo}`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do material"
          style={{ ...campo, flex: "1 1 130px", minWidth: 0 }}
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }}
          placeholder="Link do Google Drive"
          style={{ ...campo, flex: "2 1 180px", minWidth: 0 }}
        />
        <button
          type="button"
          onClick={adicionar}
          disabled={!podeAdicionar}
          style={{ ...campo, display: "flex", alignItems: "center", gap: 5, cursor: podeAdicionar ? "pointer" : "not-allowed", opacity: podeAdicionar ? 1 : 0.5 }}
        >
          <PlusCircle size={12} /> Adicionar
        </button>
      </div>
      <div style={{ marginTop: 4, color: palette.textFaint, fontSize: 10.5 }}>
        No Drive, clique em Compartilhar e deixe o acesso para quem tem o link (ou para a empresa), depois cole o link aqui. O material é salvo ao salvar o treinamento.
      </div>
    </div>
  );
}
