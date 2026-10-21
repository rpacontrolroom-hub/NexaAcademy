const cache = new Map<string, number | null>();

/** Lê a duração (em segundos) de um vídeo do YouTube carregando-o num player escondido
 *  e ouvindo os eventos do player (o mesmo canal que mede o progresso das aulas).
 *  Devolve null se o vídeo for privado/inexistente ou não responder a tempo. */
export function buscarDuracaoYoutube(videoId: string, timeoutMs = 15000): Promise<number | null> {
  if (cache.has(videoId)) return Promise.resolve(cache.get(videoId) ?? null);
  if (typeof document === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:200px;height:113px;border:0;opacity:0;pointer-events:none";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;

    let encerrado = false;
    const handshake = () => iframe.contentWindow?.postMessage(JSON.stringify({ event: "listening", channel: "widget" }), "*");
    const intervalo = window.setInterval(handshake, 1000);
    const limite = window.setTimeout(() => encerrar(null), timeoutMs);

    function encerrar(segundos: number | null) {
      if (encerrado) return;
      encerrado = true;
      window.clearInterval(intervalo);
      window.clearTimeout(limite);
      window.removeEventListener("message", aoReceber);
      iframe.remove();
      cache.set(videoId, segundos);
      resolve(segundos);
    }

    function aoReceber(event: MessageEvent) {
      if (event.source !== iframe.contentWindow) return;
      let dados: { event?: string; info?: { duration?: number } } | null;
      try { dados = typeof event.data === "string" ? JSON.parse(event.data) : event.data; } catch { return; }
      const duracao = dados?.info && typeof dados.info === "object" ? dados.info.duration : undefined;
      // O initialDelivery já traz a duração, sem precisar dar play no vídeo.
      if ((dados?.event === "initialDelivery" || dados?.event === "infoDelivery") && typeof duracao === "number" && duracao > 0) encerrar(Math.round(duracao));
    }

    window.addEventListener("message", aoReceber);
    iframe.onload = handshake;
    document.body.appendChild(iframe);
  });
}
