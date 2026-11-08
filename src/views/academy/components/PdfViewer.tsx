import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

// pdf.js só roda no navegador: carregado sob demanda (fora do SSR) e uma vez só.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function carregarPdfjs() {
  pdfjsPromise ??= Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjsPromise;
}

/** Desenha a página `n` no canvas cabendo na largura (e, se informada, na altura) disponível, nítida em telas de alta densidade. */
async function desenharPagina(doc: PDFDocumentProxy, n: number, canvas: HTMLCanvasElement, largura: number, alturaMax?: number): Promise<RenderTask> {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  let escala = largura / base.width;
  if (alturaMax && base.height * escala > alturaMax) escala = alturaMax / base.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = page.getViewport({ scale: escala * dpr });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
  return page.render({ canvas, viewport });
}

function ignorarCancelamento(e: unknown) {
  if ((e as { name?: string })?.name !== "RenderingCancelledException") console.warn("Falha ao desenhar página do PDF:", e);
}

const css = `
  .pdf-viewer { position:relative; display:flex; flex-direction:column; background:#0b1220; border-radius:inherit; outline:none; }
  .pdf-viewer:fullscreen { justify-content:center; border-radius:0; }
  .pdf-stage { position:relative; display:flex; align-items:center; justify-content:center; min-height:240px; overflow:hidden; user-select:none; }
  .pdf-viewer:fullscreen .pdf-stage { flex:1; }
  .pdf-stage canvas { display:block; border-radius:6px; box-shadow:0 20px 50px -20px rgba(0,0,0,.8); background:#fff; animation:pdf-in .35s ease both; }
  @keyframes pdf-in { from { opacity:.0; transform:scale(.985); } to { opacity:1; transform:none; } }
  .pdf-hit { position:absolute; top:0; bottom:0; width:30%; display:flex; align-items:center; padding:0 14px; border:0; background:transparent; cursor:pointer; color:#fff; opacity:0; transition:opacity .2s; }
  .pdf-hit.prev { left:0; justify-content:flex-start; }
  .pdf-hit.next { right:0; justify-content:flex-end; }
  .pdf-stage:hover .pdf-hit:not(:disabled) { opacity:1; }
  .pdf-hit:disabled { cursor:default; }
  .pdf-hit span { display:grid; place-items:center; width:44px; height:44px; border-radius:50%; background:rgba(10,20,40,.7); backdrop-filter:blur(8px); box-shadow:0 0 0 1px rgba(255,255,255,.15); }
  .pdf-bar { display:flex; align-items:center; gap:12px; padding:10px 12px 10px 16px; color:#cfd8e6; font-size:12.5px; }
  .pdf-bar button { display:grid; place-items:center; width:34px; height:34px; padding:0; color:#fff; background:transparent; border:0; border-radius:9px; cursor:pointer; }
  .pdf-bar button:hover:not(:disabled) { background:rgba(255,255,255,.12); }
  .pdf-bar button:disabled { opacity:.35; cursor:default; }
  .pdf-count { min-width:64px; text-align:center; font-variant-numeric:tabular-nums; }
  .pdf-track { flex:1; height:4px; border-radius:999px; background:rgba(255,255,255,.14); overflow:hidden; cursor:pointer; }
  .pdf-track span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#3a8cff,#9fd2ff); transition:width .35s ease; }
  .pdf-pages { display:flex; flex-direction:column; align-items:center; gap:14px; max-height:80vh; padding:16px; overflow-y:auto; }
  .pdf-viewer:fullscreen .pdf-pages { max-height:none; flex:1; }
  .pdf-pages canvas { display:block; border-radius:4px; background:#fff; box-shadow:0 12px 30px -14px rgba(0,0,0,.8); }
  .pdf-page-slot { width:100%; display:flex; justify-content:center; }
  .pdf-vistos { padding:4px 10px; border-radius:999px; font-size:11.5px; font-weight:600; white-space:nowrap; color:#cfe3f7; background:rgba(255,255,255,.08); }
  .pdf-vistos.ok { color:#7ee2b0; background:rgba(62,207,142,.16); }
  .pdf-status { display:grid; place-items:center; min-height:260px; color:#9fb0c8; font-size:13px; }
`;

/** Página do modo documento: só desenha quando entra na tela. */
function PaginaDocumento({ doc, n, largura, onVista }: { doc: PDFDocumentProxy; n: number; largura: number; onVista: (n: number) => void }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visivel, setVisivel] = useState(n <= 2);

  useEffect(() => {
    const el = slotRef.current;
    if (!el || visivel) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisivel(true); }, { rootMargin: "600px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visivel]);

  // Conta como vista quando metade da página (ou boa parte da tela) ficou à vista.
  const onVistaRef = useRef(onVista);
  onVistaRef.current = onVista;
  useEffect(() => {
    const el = slotRef.current;
    if (!el || !visivel) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= window.innerHeight * 0.4)) {
        onVistaRef.current(n);
        obs.disconnect();
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visivel, n]);

  useEffect(() => {
    if (!visivel || !canvasRef.current || largura <= 0) return;
    let task: RenderTask | null = null;
    let cancelado = false;
    desenharPagina(doc, n, canvasRef.current, largura).then((t) => {
      if (cancelado) { t.cancel(); return; }
      task = t;
      t.promise.catch(ignorarCancelamento);
    }).catch(ignorarCancelamento);
    return () => { cancelado = true; task?.cancel(); };
  }, [doc, n, largura, visivel]);

  return (
    <div className="pdf-page-slot" ref={slotRef} style={visivel ? undefined : { minHeight: largura * 1.3 }}>
      {visivel && <canvas ref={canvasRef} aria-label={`Página ${n}`} />}
    </div>
  );
}

/** Mostra um PDF dentro do app: slides (páginas deitadas) um por vez ocupando a largura, documentos (páginas em pé) em rolagem.
 *  Se o pdf.js não conseguir abrir o arquivo, chama `onFalha` para o chamador usar o visualizador do navegador. */
export interface ProgressoPdf { vistas: number; total: number; modo: "slides" | "paginas" }

function lerVistas(chave: string | null | undefined): number[] {
  if (!chave) return [];
  try { return JSON.parse(localStorage.getItem(chave) ?? "[]").filter((n: unknown) => Number.isInteger(n)); } catch { return []; }
}
function salvarVistas(chave: string | null | undefined, vistas: Set<number>) {
  if (!chave) return;
  try { localStorage.setItem(chave, JSON.stringify([...vistas])); } catch { /* sem armazenamento: vale só nesta visita */ }
}

/** `chaveProgresso` guarda no navegador quais páginas já foram vistas; `onProgresso` avisa a cada página nova. */
export default function PdfViewer({ blob, title, onFalha, chaveProgresso, onProgresso }: {
  blob: Blob; title: string; onFalha: () => void; chaveProgresso?: string | null; onProgresso?: (p: ProgressoPdf) => void;
}) {
  const raizRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [modo, setModo] = useState<"slides" | "paginas">("slides");
  const [pagina, setPagina] = useState(1);
  const [largura, setLargura] = useState(0);
  const [altura, setAltura] = useState(0);
  const [telaCheia, setTelaCheia] = useState(false);
  const [vistas, setVistas] = useState<Set<number>>(new Set());
  const onFalhaRef = useRef(onFalha);
  onFalhaRef.current = onFalha;
  const onProgressoRef = useRef(onProgresso);
  onProgressoRef.current = onProgresso;

  // Abre o arquivo e decide o modo pela orientação da primeira página.
  useEffect(() => {
    let cancelado = false;
    let aberto: PDFDocumentProxy | null = null;
    setDoc(null);
    setPagina(1);
    (async () => {
      const pdfjs = await carregarPdfjs();
      const data = new Uint8Array(await blob.arrayBuffer());
      aberto = await pdfjs.getDocument({ data }).promise;
      const primeira = (await aberto.getPage(1)).getViewport({ scale: 1 });
      if (cancelado) return;
      setModo(primeira.width > primeira.height ? "slides" : "paginas");
      setVistas(new Set(lerVistas(chaveProgresso).filter((n) => n >= 1 && n <= aberto!.numPages)));
      setDoc(aberto);
    })().catch((e) => {
      console.warn("pdf.js não abriu o arquivo:", e);
      if (!cancelado) onFalhaRef.current();
    });
    return () => { cancelado = true; aberto?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  // Acompanha o tamanho disponível para redesenhar ao redimensionar ou entrar em tela cheia.
  useEffect(() => {
    const el = raizRef.current;
    if (!el) return;
    const medir = () => {
      setLargura(el.clientWidth);
      setAltura(document.fullscreenElement === el ? window.innerHeight - 100 : 0);
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    const aoMudarTelaCheia = () => { setTelaCheia(document.fullscreenElement === el); medir(); };
    document.addEventListener("fullscreenchange", aoMudarTelaCheia);
    return () => { obs.disconnect(); document.removeEventListener("fullscreenchange", aoMudarTelaCheia); };
  }, [doc]);

  // Modo slides: desenha a página atual.
  useEffect(() => {
    if (!doc || modo !== "slides" || !canvasRef.current || largura <= 0) return;
    let task: RenderTask | null = null;
    let cancelado = false;
    desenharPagina(doc, pagina, canvasRef.current, largura - 16, altura || undefined).then((t) => {
      if (cancelado) { t.cancel(); return; }
      task = t;
      t.promise.catch(ignorarCancelamento);
    }).catch(ignorarCancelamento);
    return () => { cancelado = true; task?.cancel(); };
  }, [doc, modo, pagina, largura, altura]);

  const total = doc?.numPages ?? 0;
  const marcarVista = useCallback((n: number) => {
    setVistas((atual) => (atual.has(n) ? atual : new Set(atual).add(n)));
  }, []);
  // No modo slides, o slide aberto conta como visto.
  useEffect(() => { if (doc && modo === "slides") marcarVista(pagina); }, [doc, modo, pagina, marcarVista]);
  useEffect(() => {
    if (!doc) return;
    salvarVistas(chaveProgresso, vistas);
    onProgressoRef.current?.({ vistas: vistas.size, total, modo });
  }, [doc, vistas, total, modo, chaveProgresso]);
  const viuTudo = total > 0 && vistas.size >= total;
  const ir = useCallback((n: number) => setPagina((atual) => (total ? Math.min(total, Math.max(1, n)) : atual)), [total]);

  function alternarTelaCheia() {
    const el = raizRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.().catch(() => {});
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (modo !== "slides") return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); ir(pagina + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); ir(pagina - 1); }
    if (e.key === "Home") ir(1);
    if (e.key === "End") ir(total);
  }

  return (
    <div className={`pdf-viewer ${modo}`} ref={raizRef} tabIndex={0} onKeyDown={aoTeclar} aria-label={title}>
      <style>{css}</style>
      {!doc ? (
        <div className="pdf-status">Preparando o arquivo...</div>
      ) : modo === "slides" ? (
        <>
          <div className="pdf-stage" style={{ padding: 8 }}>
            <canvas key={pagina} ref={canvasRef} aria-label={`Slide ${pagina} de ${total}`} />
            <button type="button" className="pdf-hit prev" disabled={pagina <= 1} onClick={() => ir(pagina - 1)} aria-label="Slide anterior"><span><ChevronLeft size={22} /></span></button>
            <button type="button" className="pdf-hit next" disabled={pagina >= total} onClick={() => ir(pagina + 1)} aria-label="Próximo slide"><span><ChevronRight size={22} /></span></button>
          </div>
          <div className="pdf-bar">
            <button type="button" onClick={() => ir(pagina - 1)} disabled={pagina <= 1} aria-label="Slide anterior"><ChevronLeft size={18} /></button>
            <span className="pdf-count">{pagina} / {total}</span>
            <button type="button" onClick={() => ir(pagina + 1)} disabled={pagina >= total} aria-label="Próximo slide"><ChevronRight size={18} /></button>
            <div
              className="pdf-track"
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); ir(Math.ceil(((e.clientX - r.left) / r.width) * total)); }}
              role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={pagina}
            >
              <span style={{ width: `${(pagina / total) * 100}%` }} />
            </div>
            <span className={`pdf-vistos ${viuTudo ? "ok" : ""}`}>{viuTudo ? "Todos vistos" : `${vistas.size} de ${total} vistos`}</span>
            <button type="button" onClick={alternarTelaCheia} aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"} title={telaCheia ? "Sair da tela cheia" : "Tela cheia"}>
              {telaCheia ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="pdf-pages">
            {Array.from({ length: total }, (_, i) => <PaginaDocumento key={i} doc={doc} n={i + 1} largura={Math.min(largura - 32, 1100)} onVista={marcarVista} />)}
          </div>
          <div className="pdf-bar">
            <span className="pdf-count">{total} {total === 1 ? "página" : "páginas"}</span>
            <span style={{ flex: 1 }} />
            <span className={`pdf-vistos ${viuTudo ? "ok" : ""}`}>{viuTudo ? "Todas vistas" : `${vistas.size} de ${total} vistas`}</span>
            <button type="button" onClick={alternarTelaCheia} aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"} title={telaCheia ? "Sair da tela cheia" : "Tela cheia"}>
              {telaCheia ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
