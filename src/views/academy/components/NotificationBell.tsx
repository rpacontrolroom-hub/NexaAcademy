import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { keys, useNotificacoes } from "@/hooks/use-academy";
import * as repo from "@/data/academy-repository";
import { timeAgo } from "@/lib/format";

const bellCss = `
  .nexa-bell-wrap { position:relative; }
  .nexa-bell-button { position:relative; width:42px; height:42px; display:flex; align-items:center; justify-content:center; padding:0; border:0; border-radius:50%; background:transparent; color:#111; cursor:pointer; transition:background .15s ease; }
  .nexa-bell-button:hover, .nexa-bell-button[aria-expanded="true"] { background:#eee; }
  .nexa-bell-badge { position:absolute; top:4px; right:3px; min-width:17px; height:17px; padding:0 4px; display:flex; align-items:center; justify-content:center; border:2px solid #f8f8f8; border-radius:999px; background:#111; color:#fff; font:700 9.5px Inter,sans-serif; }
  .nexa-bell-backdrop { position:fixed; inset:0; z-index:58; background:transparent; }
  .nexa-bell-panel { position:absolute; top:calc(100% + 10px); right:0; z-index:59; width:min(360px, calc(100vw - 24px)); max-height:min(460px, calc(100vh - 120px)); display:flex; flex-direction:column; overflow:hidden; background:#fff; border:1px solid #dedede; border-radius:12px; box-shadow:0 16px 38px rgba(0,0,0,.14); }
  .nexa-bell-head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid #eee; font:700 13px Inter,sans-serif; color:#111; }
  .nexa-bell-head button { display:flex; align-items:center; gap:5px; padding:4px 6px; border:0; border-radius:6px; background:transparent; color:#555; font:500 11.5px Inter,sans-serif; cursor:pointer; }
  .nexa-bell-head button:hover { background:#f2f2f2; color:#111; }
  .nexa-bell-list { overflow-y:auto; }
  .nexa-bell-item { display:flex; gap:10px; width:100%; padding:11px 14px; border:0; border-bottom:1px solid #f1f1f1; background:#fff; text-align:left; font-family:Inter,sans-serif; cursor:default; }
  .nexa-bell-item.link { cursor:pointer; }
  .nexa-bell-item.link:hover { background:#fafafa; }
  .nexa-bell-item:last-child { border-bottom:0; }
  .nexa-bell-dot { width:8px; height:8px; flex:0 0 8px; margin-top:5px; border-radius:50%; background:#111; }
  .nexa-bell-dot.read { background:transparent; }
  .nexa-bell-title { color:#111; font-size:12.5px; font-weight:600; }
  .nexa-bell-msg { margin-top:2px; color:#555; font-size:12px; line-height:1.45; white-space:pre-wrap; }
  .nexa-bell-time { margin-top:4px; color:#999; font-size:10.5px; display:flex; align-items:center; gap:4px; }
  .nexa-bell-empty { padding:28px 16px; color:#777; text-align:center; font:400 12.5px Inter,sans-serif; }
`;

export default function NotificationBell({ userId }: { userId?: string }) {
  const queryClient = useQueryClient();
  const { data: notificacoes = [] } = useNotificacoes(userId);
  const [aberto, setAberto] = useState(false);
  const naoLidas = notificacoes.filter((n) => !n.lida);

  async function marcarLidas(ids: string[]) {
    if (!userId || !ids.length) return;
    // Atualiza a tela na hora; o servidor confirma em seguida.
    queryClient.setQueryData<repo.Notificacao[]>(keys.notificacoes(userId), (atual) => atual?.map((n) => (ids.includes(n.id) ? { ...n, lida: true } : n)));
    try {
      await repo.marcarNotificacoesLidas(userId, ids);
    } finally {
      queryClient.invalidateQueries({ queryKey: keys.notificacoes(userId) });
    }
  }

  function abrirNotificacao(n: repo.Notificacao) {
    if (!n.lida) marcarLidas([n.id]);
    if (!n.link) return;
    if (/^https?:\/\//i.test(n.link)) window.open(n.link, "_blank", "noopener,noreferrer");
    else window.location.assign(n.link);
  }

  return (
    <div className="nexa-bell-wrap">
      <style>{bellCss}</style>
      <button
        type="button"
        className="nexa-bell-button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={naoLidas.length ? `Notificações (${naoLidas.length} não lidas)` : "Notificações"}
      >
        <Bell size={22} />
        {naoLidas.length > 0 && <span className="nexa-bell-badge">{naoLidas.length > 9 ? "9+" : naoLidas.length}</span>}
      </button>

      {aberto && (
        <>
          <div className="nexa-bell-backdrop" onClick={() => setAberto(false)} />
          <div className="nexa-bell-panel" role="dialog" aria-label="Notificações">
            <div className="nexa-bell-head">
              Notificações
              {naoLidas.length > 0 && (
                <button type="button" onClick={() => marcarLidas(naoLidas.map((n) => n.id))}><CheckCheck size={14} /> Marcar todas como lidas</button>
              )}
            </div>
            <div className="nexa-bell-list">
              {notificacoes.length === 0 && <div className="nexa-bell-empty">Você não tem notificações.</div>}
              {notificacoes.map((n) => (
                <button key={n.id} type="button" className={`nexa-bell-item ${n.link ? "link" : ""}`} onClick={() => abrirNotificacao(n)}>
                  <span className={`nexa-bell-dot ${n.lida ? "read" : ""}`} />
                  <span style={{ minWidth: 0 }}>
                    <div className="nexa-bell-title">{n.titulo}</div>
                    <div className="nexa-bell-msg">{n.mensagem}</div>
                    <div className="nexa-bell-time">{timeAgo(n.created_at)}{n.link && <ExternalLink size={11} />}</div>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
