import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, KeyRound, RefreshCw, X } from "lucide-react";
import { theme as palette } from "@/styles/theme";
import * as repo from "@/data/academy-repository";

interface AdminSetPasswordModalProps {
  usuario: { id: string; name: string; email: string };
  onClose: () => void;
}

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar passar a senha para a pessoa.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function gerarSenha(tamanho = 12) {
  const valores = crypto.getRandomValues(new Uint32Array(tamanho));
  return Array.from(valores, (v) => ALFABETO[v % ALFABETO.length]).join("");
}

const campo = {
  width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
  borderRadius: 9, padding: "9px 12px", color: palette.textPrimary, fontSize: 13, outline: "none",
};

export default function AdminSetPasswordModal({ usuario, onClose }: AdminSetPasswordModalProps) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [temporaria, setTemporaria] = useState(true);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const erroSenha = senha.length < 8 ? "Mínimo de 8 caracteres." : null;
  const erroConfirmacao = senha !== confirmacao ? "As senhas não coincidem." : null;

  function preencherGerada() {
    const nova = gerarSenha();
    setSenha(nova);
    setConfirmacao(nova);
    setMostrar(true);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      toast.success("Senha copiada");
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  async function salvar() {
    setTentou(true);
    if (erroSenha || erroConfirmacao || salvando) return;
    setSalvando(true);
    try {
      await repo.adminDefinirSenha(usuario.id, senha, temporaria);
      toast.success(temporaria ? `Senha temporária definida para ${usuario.name}` : `Senha definida para ${usuario.name}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75 }} onClick={onClose}>
      <div className="nexa-card" style={{ width: "min(460px, calc(100vw - 32px))", padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div className="nexa-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><KeyRound size={16} /> Definir senha</div>
            <div style={{ marginTop: 4, color: palette.textFaint, fontSize: 11.5 }}>{usuario.name} · {usuario.email}</div>
          </div>
          <button className="nexa-btn-ghost" type="button" onClick={onClose} aria-label="Fechar"><X size={15} /></button>
        </div>

        <label style={{ display: "block", fontSize: 11.5, color: palette.textMuted, marginBottom: 6 }}>Nova senha</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input
            type={mostrar ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
            style={{ ...campo, flex: 1, borderColor: tentou && erroSenha ? "#F2596B" : palette.border }}
          />
          <button className="nexa-btn-ghost" type="button" onClick={() => setMostrar((m) => !m)} aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}>{mostrar ? <EyeOff size={14} /> : <Eye size={14} />}</button>
          {senha && <button className="nexa-btn-ghost" type="button" onClick={copiar} aria-label="Copiar senha" title="Copiar senha"><Copy size={14} /></button>}
        </div>
        {tentou && erroSenha && <small style={{ color: "#c2414f" }}>{erroSenha}</small>}
        <button type="button" onClick={preencherGerada} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12, padding: 0, border: 0, background: "transparent", color: palette.textMuted, fontSize: 11.5, cursor: "pointer" }}>
          <RefreshCw size={12} /> Gerar senha segura
        </button>

        <label style={{ display: "block", fontSize: 11.5, color: palette.textMuted, marginBottom: 6 }}>Confirmar senha</label>
        <input
          type={mostrar ? "text" : "password"}
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          autoComplete="new-password"
          style={{ ...campo, marginBottom: 4, borderColor: tentou && erroConfirmacao ? "#F2596B" : palette.border }}
        />
        {tentou && erroConfirmacao && <small style={{ color: "#c2414f" }}>{erroConfirmacao}</small>}

        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, fontSize: 12.5, color: palette.textPrimary, cursor: "pointer" }}>
          <input type="checkbox" checked={temporaria} onChange={(e) => setTemporaria(e.target.checked)} style={{ marginTop: 2 }} />
          <span>
            Senha temporária
            <span style={{ display: "block", color: palette.textFaint, fontSize: 11 }}>No próximo acesso, a pessoa precisa criar a própria senha.</span>
          </span>
        </label>

        <div style={{ marginTop: 14, padding: "9px 11px", borderRadius: 8, background: "#f6f6f6", color: palette.textMuted, fontSize: 11.5, lineHeight: 1.5 }}>
          As sessões abertas dessa pessoa serão encerradas. Passe a senha por um canal privado (ex.: Teams direto), nunca em grupo.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 18 }}>
          <button className="nexa-btn-ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="nexa-btn-primary" type="button" onClick={salvar} disabled={salvando}><KeyRound size={14} /> {salvando ? "Salvando..." : "Definir senha"}</button>
        </div>
      </div>
    </div>
  );
}
