import { useEffect, useMemo, useState } from "react";
import { buscarArquivoDrive } from "@/lib/drive-client";
import FishLoader from "@/views/academy/components/FishLoader";
import PdfViewer, { type ProgressoPdf } from "@/views/academy/components/PdfViewer";

/** Mostra um arquivo do Drive lido pelo servidor com a conta de serviço (sem login do Google).
 *  PDFs abrem no visualizador do app (slides um por vez, documentos em rolagem); se ele não abrir o arquivo,
 *  usa o visualizador do navegador. Se o servidor não conseguir, cai no iframe do próprio Drive (`fallbackSrc`).
 *  `onControle` diz se dá para acompanhar a leitura: o progresso das páginas (visualizador do app) ou "livre" (visualizador
 *  do navegador/Drive, que não informa o que foi visto). */
export default function DriveViewer({ id, title, fallbackSrc, chaveProgresso, onControle }: {
  id: string; title: string; fallbackSrc: string; chaveProgresso?: string | null; onControle?: (c: ProgressoPdf | "livre") => void;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [usarNavegador, setUsarNavegador] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setBlob(null);
    setFalhou(false);
    setUsarNavegador(false);
    buscarArquivoDrive(id, "ver")
      .then(({ blob }) => { if (!cancelado) setBlob(blob); })
      .catch((e) => { console.warn("Drive via servidor falhou:", e instanceof Error ? e.message : e); if (!cancelado) setFalhou(true); });
    return () => { cancelado = true; };
  }, [id]);

  const ehPdf = !!blob && (blob.type === "" || blob.type.includes("pdf"));
  const src = useMemo(() => (blob && (!ehPdf || usarNavegador) ? URL.createObjectURL(blob) : null), [blob, ehPdf, usarNavegador]);
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const semControle = falhou || (!!blob && (!ehPdf || usarNavegador));
  useEffect(() => { if (semControle) onControle?.("livre"); }, [semControle, onControle]);

  if (falhou) return <iframe src={fallbackSrc} title={title} allow="fullscreen" allowFullScreen loading="lazy" />;
  if (!blob) return <FishLoader texto="Mergulhando no conteúdo" />;
  if (ehPdf && !usarNavegador) return <PdfViewer blob={blob} title={title} onFalha={() => setUsarNavegador(true)} chaveProgresso={chaveProgresso} onProgresso={onControle} />;
  return src ? <iframe src={src} title={title} allowFullScreen /> : null;
}
