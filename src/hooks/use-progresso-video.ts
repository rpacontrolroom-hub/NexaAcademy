import { useEffect, useRef, useState, type RefObject } from "react";

/** Percentual do vídeo que precisa ser assistido para concluir a aula. */
export const PERCENTUAL_MINIMO_VIDEO = 90;

// Entre duas leituras do player, um avanço maior que isso é pulo (seek), não reprodução.
const AVANCO_MAXIMO_SEGUNDOS = 2;

interface ProgressoSalvo {
  d: number;   // duração do vídeo (s)
  s: number[]; // segundos assistidos
}

/**
 * Mede quanto do vídeo do YouTube foi realmente assistido, usando os eventos
 * oficiais do player (postMessage com enablejsapi=1). Só conta o trecho que
 * avançou em reprodução normal: pular para frente não soma. O progresso fica
 * salvo no navegador (chave por usuário + aula + vídeo) para não se perder ao recarregar.
 */
export function useProgressoVideo(iframeRef: RefObject<HTMLIFrameElement | null>, chave: string | null, aoAtingirMinimo: () => void) {
  const [percentual, setPercentual] = useState(0);
  const assistidos = useRef<Set<number>>(new Set());
  const duracao = useRef(0);
  const ultimoTempo = useRef<number | null>(null);
  const jaAvisou = useRef(false);
  const ultimoPercentual = useRef(0);
  const aoAtingirRef = useRef(aoAtingirMinimo);
  aoAtingirRef.current = aoAtingirMinimo;

  function calcular() {
    const total = Math.ceil(duracao.current);
    return total > 0 ? Math.min(100, Math.round((assistidos.current.size / total) * 100)) : 0;
  }

  // Troca de aula/vídeo: recomeça a contagem a partir do que estiver salvo.
  useEffect(() => {
    assistidos.current = new Set();
    duracao.current = 0;
    ultimoTempo.current = null;
    jaAvisou.current = false;
    ultimoPercentual.current = 0;
    setPercentual(0);
    if (!chave) return;
    try {
      const salvo = JSON.parse(localStorage.getItem(chave) ?? "null") as ProgressoSalvo | null;
      if (salvo?.d && Array.isArray(salvo.s)) {
        duracao.current = salvo.d;
        assistidos.current = new Set(salvo.s);
        ultimoPercentual.current = calcular();
        setPercentual(ultimoPercentual.current);
      }
    } catch {
      // Sem acesso ao armazenamento local: a contagem vale só para esta visita.
    }
  }, [chave]);

  useEffect(() => {
    function aoReceberMensagem(event: MessageEvent) {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(event.origin)) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      let dados: { event?: string; info?: { currentTime?: number; duration?: number } } | null;
      try { dados = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      if (dados?.event !== "infoDelivery" || !dados.info || typeof dados.info !== "object") return;

      const { currentTime, duration } = dados.info;
      if (typeof duration === "number" && duration > 0) duracao.current = duration;
      if (typeof currentTime !== "number") return;

      const anterior = ultimoTempo.current;
      ultimoTempo.current = currentTime;
      if (anterior === null) return;
      const avanco = currentTime - anterior;
      if (avanco <= 0 || avanco > AVANCO_MAXIMO_SEGUNDOS) return;

      for (let s = Math.floor(anterior); s <= Math.floor(currentTime); s++) assistidos.current.add(s);
      const atual = calcular();
      if (atual !== ultimoPercentual.current) {
        ultimoPercentual.current = atual;
        setPercentual(atual);
        if (chave) {
          try { localStorage.setItem(chave, JSON.stringify({ d: duracao.current, s: [...assistidos.current] } satisfies ProgressoSalvo)); } catch { /* sem armazenamento local */ }
        }
      }
      if (atual >= PERCENTUAL_MINIMO_VIDEO && !jaAvisou.current) {
        jaAvisou.current = true;
        aoAtingirRef.current();
      }
    }
    window.addEventListener("message", aoReceberMensagem);
    return () => window.removeEventListener("message", aoReceberMensagem);
  }, [iframeRef, chave]);

  /** Chamar no onLoad do iframe: pede ao player para enviar tempo e estado. */
  function escutarPlayer() {
    const player = iframeRef.current?.contentWindow;
    if (!player) return;
    ultimoTempo.current = null;
    player.postMessage(JSON.stringify({ event: "listening", channel: "widget" }), "*");
    player.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"], channel: "widget" }), "*");
  }

  return { percentual, escutarPlayer };
}
