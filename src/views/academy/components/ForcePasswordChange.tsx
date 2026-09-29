import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRound, LogOut } from "lucide-react";
import { theme as palette } from "@/styles/theme";
import * as repo from "@/data/academy-repository";

interface ForcePasswordChangeProps {
  userId: string;
  onConcluido: () => void;
  onSair: () => void;
}

const campo = {
  width: "100%", background: palette.bgPanel, border: `1px solid ${palette.border}`,
  borderRadius: 9, padding: "10px 12px", color: palette.textPrimary, fontSize: 13, outline: "none",
};

/** Bloqueia o app até o usuário trocar a senha temporária definida pelo admin. */
export default function ForcePasswordChange({ userId, onConcluido, onSair }: ForcePasswordChangeProps) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) return setErro("A senha precisa ter no mínimo 8 caracteres.");
    if (senha !== confirmacao) return setErro("As senhas não coincidem.");
    setSalvando(true);
    try {
      await repo.concluirTrocaDeSenha(userId, senha);
      toast.success("Senha criada! Bem-vindo(a) à Nexa Academy.");
      onConcluido();
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="nexa-certificate-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90 }} role="dialog" aria-modal="true" aria-labelledby="troca-senha-titulo">
      <form className="nexa-card" style={{ width: "min(420px, calc(100vw - 32px))", padding: 24 }} onSubmit={salvar}>
        <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 10, background: "#f3f3f3", marginBottom: 14 }}><KeyRound size={20} /></div>
        <h2 id="troca-senha-titulo" className="nexa-heading" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Crie sua senha</h2>
        <p style={{ margin: "6px 0 18px", color: palette.textMuted, fontSize: 12.5, lineHeight: 1.5 }}>
          Você entrou com uma senha temporária definida pelo administrador. Para continuar, crie uma senha só sua.
        </p>

        <label style={{ display: "block", fontSize: 11.5, color: palette.textMuted, marginBottom: 6 }}>Nova senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" autoFocus style={{ ...campo, marginBottom: 12 }} />
        <label style={{ display: "block", fontSize: 11.5, color: palette.textMuted, marginBottom: 6 }}>Confirmar nova senha</label>
        <input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="new-password" style={campo} />
        {erro && <div role="alert" style={{ marginTop: 10, color: "#c2414f", fontSize: 12 }}>{erro}</div>}

        <button className="nexa-btn-primary" type="submit" disabled={salvando} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
          {salvando ? "Salvando..." : "Salvar senha e continuar"}
        </button>
        <button type="button" onClick={onSair} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10, padding: 8, border: 0, background: "transparent", color: palette.textMuted, fontSize: 12, cursor: "pointer" }}>
          <LogOut size={13} /> Sair
        </button>
      </form>
    </div>
  );
}
