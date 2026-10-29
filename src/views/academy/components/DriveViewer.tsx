import { useEffect, useState } from "react";
import { buscarArquivoDrive } from "@/lib/drive-client";

/** Mostra um arquivo do Drive como PDF, lido pelo servidor com a conta de serviço (sem login do Google).
 *  Se o servidor não conseguir, cai no iframe do próprio Drive (`fallbackSrc`). */
export default function DriveViewer({ id, title, fallbackSrc }: { id: string; title: string; fallbackSrc: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let cancelado = false;
    setSrc(null);
    setFalhou(false);
    buscarArquivoDrive(id, "ver")
      .then(({ blob }) => { if (!cancelado) { url = URL.createObjectURL(blob); setSrc(url); } })
      .catch((e) => { console.warn("Drive via servidor falhou:", e instanceof Error ? e.message : e); if (!cancelado) setFalhou(true); });
    return () => { cancelado = true; if (url) URL.revokeObjectURL(url); };
  }, [id]);

  if (falhou) return <iframe src={fallbackSrc} title={title} allow="fullscreen" allowFullScreen loading="lazy" />;
  if (!src) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, opacity: 0.7 }}>Carregando arquivo...</div>;
  return <iframe src={src} title={title} allowFullScreen />;
}
