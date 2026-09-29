import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Paperclip, PlusCircle, X } from "lucide-react";
import { theme as palette } from "@/styles/theme";
import { formatBytes } from "@/lib/format";
import type { TrainingMaterial } from "@/models/training";

// Limite padrão de upload do Supabase Storage (plano free).
const TAMANHO_MAXIMO = 50 * 1024 * 1024;
const FORMATOS = ".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.ppt,.pptx,.txt,.odt,.ods,.odp,.rtf,.zip,.png,.jpg,.jpeg";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  function escolher(file: File | undefined) {
    if (!file) return;
    if (file.size > TAMANHO_MAXIMO) {
      toast.error(`"${file.name}" tem ${formatBytes(file.size)}. O limite é ${formatBytes(TAMANHO_MAXIMO)}.`);
      return;
    }
    setArquivo(file);
    if (!nome.trim()) setNome(file.name.replace(/\.[^.]+$/, ""));
  }

  function adicionar() {
    if (!arquivo) return;
    onChange([...materiais, { titulo: nome.trim() || arquivo.name, arquivo, tamanhoBytes: arquivo.size }]);
    setNome("");
    setArquivo(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: palette.textPrimary, fontSize: 12, fontWeight: 600, marginBottom: descricao ? 2 : 6 }}>
        <Paperclip size={13} /> {titulo}
      </div>
      {descricao && <div style={{ color: palette.textFaint, fontSize: 10.5, marginBottom: 8 }}>{descricao}</div>}

      {materiais.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 6 }}>
          {materiais.map((m, i) => (
            <div key={m.id ?? `novo-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={13} color={palette.textMuted} style={{ flexShrink: 0 }} />
              <input
                value={m.titulo}
                onChange={(e) => onChange(materiais.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))}
                aria-label="Nome do material"
                style={{ ...campo, flex: 1, minWidth: 0, padding: "5px 8px" }}
              />
              <span style={{ fontSize: 10.5, color: palette.textFaint, whiteSpace: "nowrap" }}>
                {m.arquivo ? `${formatBytes(m.tamanhoBytes)} · a enviar` : formatBytes(m.tamanhoBytes)}
              </span>
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
          style={{ ...campo, flex: "1 1 160px", minWidth: 0 }}
        />
        <input ref={inputRef} type="file" accept={FORMATOS} hidden onChange={(e) => escolher(e.target.files?.[0])} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title={arquivo?.name}
          style={{ ...campo, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          <Paperclip size={12} /> {arquivo ? arquivo.name : "Escolher arquivo"}
        </button>
        <button
          type="button"
          onClick={adicionar}
          disabled={!arquivo}
          style={{ ...campo, display: "flex", alignItems: "center", gap: 5, cursor: arquivo ? "pointer" : "not-allowed", opacity: arquivo ? 1 : 0.5 }}
        >
          <PlusCircle size={12} /> Adicionar
        </button>
      </div>
      <div style={{ marginTop: 4, color: palette.textFaint, fontSize: 10.5 }}>PDF, Word, Excel, PowerPoint, CSV, TXT, ZIP ou imagem · até 50 MB. O envio acontece ao salvar o treinamento.</div>
    </div>
  );
}
