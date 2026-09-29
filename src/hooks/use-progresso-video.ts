import { useEffect, useRef, useState, type RefObject } from "react";

/** Percentual do vídeo que precisa ser assistido para concluir a aula. */
export const PERCENTUAL_MINIMO_VIDEO = 90;

// Entre duas leituras do player, um avanço maior que isso é pulo (seek), não reprodução.
const AVANCO_MAXIMO_SEGUNDOS = 2;
// De quanto em quanto tempo o progresso é enviado ao servidor.
const INTERVALO_ENVIO_MS = 10_000;

interface ProgressoSalvo {
  d: number;   // duração do vídeo (s)
  s: number[]; // segundos assistidos
}

/** Envia ao servidor os segundos novos assistidos da aula; devolve o % aceito pelo servidor (ou null). */
export type EnviarProgressoVideo = (aulaId: string, segundos: number, duracao: number) => Promise<number | null>;

/**
 * Mede quanto do vídeo do YouTube foi realmente assistido, usando os eventos
 * oficiais do player (postMessage com enablejsapi=1). Só conta o trecho que
 * avançou em reprodução normal: pular para frente não soma.
 *
 * O servidor é quem decide se a aula pode ser concluída: os segundos novos são
 * enviados periodicamente e ele só aceita o que for compatível com o tempo real.
 * O navegador guarda uma cópia local (por usuário + aula + vídeo) só para exibição.
 */
export function useProgressoVideo(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  aulaId: string | null,
  chave: string | null,
  aoAtingirMinimo: () => void,
  enviarProgresso?: EnviarProgressoVideo,
) {
  const [percentualLocal, setPercentualLocal] = useState(0);
  const [percentualServidor, setPercentualServidor] = useState<number | null>(null);
  const [chegouAoFim, setChegouAoFim] = useState(false);
  const assistidos = useRef<Set<number>>(new Set());
  // Segundos já contados para o servidor nesta visita. Separado de `assistidos` porque
  // a cópia local pode ter segundos que o servidor nunca recebeu.
  const contadosServidor = useRef<Set<number>>(new Set());
  const aulaAtual = useRef<string | null>(null);
  const duracao = useRef(0);
  const ultimoTempo = useRef<number | null>(null);
  const ultimoPercentual = useRef(0);
  const pendentes = useRef(0);
  const inicializado = useRef(false);
  const jaAvisou = useRef(false);
  const aoAtingirRef = useRef(aoAtingirMinimo);
  aoAtingirRef.current = aoAtingirMinimo;
  const enviarRef = useRef(enviarProgresso);
  enviarRef.current = enviarProgresso;

  // Enquanto o servidor não responde (ou a função não existe no banco), vale a contagem local.
  const percentual = percentualServidor ?? percentualLocal;

  function calcular() {
    const total = Math.ceil(duracao.current);
    return total > 0 ? Math.min(100, Math.round((assistidos.current.size / total) * 100)) : 0;
  }

  function sincronizar() {
    const enviar = enviarRef.current;
    const aula = aulaAtual.current;
    if (!enviar || !aula || duracao.current <= 0) return;
    const segundos = pendentes.current;
    if (segundos <= 0 && inicializado.current) return;
    pendentes.current = 0;
    inicializado.current = true;
    enviar(aula, segundos, duracao.current)
      .then((p) => { if (p !== null && aulaAtual.current === aula) setPercentualServidor(Math.round(p)); })
      .catch(() => { if (aulaAtual.current === aula) pendentes.current += segundos; });
  }

  // Troca de aula/vídeo: envia o que faltou da anterior e recomeça a contagem.
  useEffect(() => {
    aulaAtual.current = aulaId;
    assistidos.current = new Set();
    contadosServidor.current = new Set();
    duracao.current = 0;
    ultimoTempo.current = null;
    ultimoPercentual.current = 0;
    pendentes.current = 0;
    inicializado.current = false;
    jaAvisou.current = false;
    setPercentualLocal(0);
    setPercentualServidor(null);
    setChegouAoFim(false);
    if (chave) {
      try {
        const salvo = JSON.parse(localStorage.getItem(chave) ?? "null") as ProgressoSalvo | null;
        if (salvo?.d && Array.isArray(salvo.s)) {
          duracao.current = salvo.d;
          assistidos.current = new Set(salvo.s);
          ultimoPercentual.current = calcular();
          setPercentualLocal(ultimoPercentual.current);
        }
      } catch {
        // Sem acesso ao armazenamento local: a contagem vale só para esta visita.
      }
    }
    const timer = window.setInterval(sincronizar, INTERVALO_ENVIO_MS);
    const aoOcultar = () => { if (document.visibilityState === "hidden") sincronizar(); };
    document.addEventListener("visibilitychange", aoOcultar);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", aoOcultar);
      sincronizar(); // ainda com aulaAtual/duração/pendentes desta aula
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId, chave]);

  useEffect(() => {
    if (percentual >= PERCENTUAL_MINIMO_VIDEO && !jaAvisou.current) {
      jaAvisou.current = true;
      aoAtingirRef.current();
    }
  }, [percentual]);

  useEffect(() => {
    function aoReceberMensagem(event: MessageEvent) {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(event.origin)) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      let dados: { event?: string; info?: number | { currentTime?: number; duration?: number; playerState?: number } } | null;
      try { dados = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      // Estado 0 do player = vídeo terminou.
      if (dados?.event === "onStateChange") {
        if (dados.info === 0) { setChegouAoFim(true); sincronizar(); }
        return;
      }
      if (dados?.event !== "infoDelivery" || !dados.info || typeof dados.info !== "object") return;

      const { currentTime, duration, playerState } = dados.info;
      if (playerState === 0) { setChegouAoFim(true); sincronizar(); }
      if (typeof duration === "number" && duration > 0) {
        duracao.current = duration;
        // Primeiro contato com o servidor: marca o início e traz o % já registrado.
        if (!inicializado.current) sincronizar();
      }
      if (typeof currentTime !== "number") return;
      if (duracao.current > 0 && currentTime >= duracao.current - 1) setChegouAoFim(true);

      const anterior = ultimoTempo.current;
      ultimoTempo.current = currentTime;
      if (anterior === null) return;
      const avanco = currentTime - anterior;
      if (avanco <= 0 || avanco > AVANCO_MAXIMO_SEGUNDOS) return;

      for (let s = Math.floor(anterior); s <= Math.floor(currentTime); s++) {
        assistidos.current.add(s);
        if (!contadosServidor.current.has(s)) {
          contadosServidor.current.add(s);
          pendentes.current += 1;
        }
      }
      const atual = calcular();
      if (atual !== ultimoPercentual.current) {
        ultimoPercentual.current = atual;
        setPercentualLocal(atual);
        if (chave) {
          try { localStorage.setItem(chave, JSON.stringify({ d: duracao.current, s: [...assistidos.current] } satisfies ProgressoSalvo)); } catch { /* sem armazenamento local */ }
        }
      }
    }
    window.addEventListener("message", aoReceberMensagem);
    return () => window.removeEventListener("message", aoReceberMensagem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeRef, chave]);

  /** Chamar no onLoad do iframe: pede ao player para enviar tempo e estado. */
  function escutarPlayer() {
    const player = iframeRef.current?.contentWindow;
    if (!player) return;
    ultimoTempo.current = null;
    player.postMessage(JSON.stringify({ event: "listening", channel: "widget" }), "*");
    player.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"], channel: "widget" }), "*");
  }

  return { percentual, chegouAoFim, escutarPlayer };
}
