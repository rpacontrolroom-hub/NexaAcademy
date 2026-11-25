import { useEffect, useMemo, useState } from "react";
import { baixarArquivoDrive, buscarArquivoDrive } from "@/lib/drive-client";
import FishLoader from "@/views/academy/components/FishLoader";
import PdfViewer, { type ProgressoPdf } from "@/views/academy/components/PdfViewer";

/** Mostra um arquivo do Drive lido pelo servidor com a conta de serviço (sem login do Google).
 *  PDFs abrem no visualizador do app (slides um por vez, documentos em rolagem); se ele não abrir o arquivo,
 *  usa o visualizador do navegador. Se o servidor não conseguir, mostra o motivo no app (nunca o iframe do Drive, que pede login do Google).
 *  `onControle` diz se dá para acompanhar a leitura: o progresso das páginas (visualizador do app) ou "livre" (visualizador
 *  do navegador/Drive, que não informa o que foi visto). */
export default function DriveViewer({ id, title, chaveProgresso, onControle }: {
  id: string; title: string; chaveProgresso?: string | null; onControle?: (c: ProgressoPdf | "livre") => void;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [usarNavegador, setUsarNavegador] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setBlob(null);
    setFalhou(false);
    setUsarNavegador(false);
    buscarArquivoDrive(id, "ver")
      .then(({ blob }) => { if (!cancelado) setBlob(blob); })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("Drive via servidor falhou:", msg);
        if (!cancelado) { setMotivo(msg.length < 200 ? msg : ""); setFalhou(true); }
      });
    return () => { cancelado = true; };
  }, [id]);

  const ehPdf = !!blob && (blob.type === "" || blob.type.includes("pdf"));
  const src = useMemo(() => (blob && (!ehPdf || usarNavegador) ? URL.createObjectURL(blob) : null), [blob, ehPdf, usarNavegador]);
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const semControle = falhou || (!!blob && (!ehPdf || usarNavegador));
  useEffect(() => { if (semControle) onControle?.("livre"); }, [semControle, onControle]);

  // Nunca cai no iframe do Google: sem a conta de serviço ele pede login. Mostra o motivo no próprio app.
  if (falhou) {
    const soBaixar = /só pode ser baixado/i.test(motivo);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, minHeight: 240, textAlign: "center" }}>
        <p style={{ margin: 0 }}>{motivo || "Não foi possível abrir este conteúdo agora."}</p>
        {soBaixar && <button type="button" className="nexa-btn-primary" onClick={() => baixarArquivoDrive(id).catch(() => undefined)}>Baixar arquivo</button>}
      </div>
    );
  }
  if (!blob) return <FishLoader texto="Mergulhando no conteúdo" />;
  if (ehPdf && !usarNavegador) return <PdfViewer blob={blob} title={title} onFalha={() => setUsarNavegador(true)} chaveProgresso={chaveProgresso} onProgresso={onControle} />;
  return src ? <iframe src={src} title={title} allowFullScreen /> : null;
}
