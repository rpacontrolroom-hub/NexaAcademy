import { useCallback, useEffect, useState } from "react";

/** "oceano" = Oceano escuro (padrão); "oceano-claro" = a mesma cara, de dia. */
export type Tema = "oceano" | "oceano-claro";

const CHAVE = "nexa-tema";

function lerTema(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    // "claro" era o tema branco antigo: quem o escolheu passa para o Oceano claro.
    return salvo === "oceano-claro" || salvo === "claro" ? "oceano-claro" : "oceano";
  } catch {
    return "oceano";
  }
}

function aplicarTema(tema: Tema) {
  const html = document.documentElement;
  html.dataset.tema = "oceano";
  if (tema === "oceano-claro") html.dataset.tom = "claro";
  else delete html.dataset.tom;
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // sem armazenamento: o tema vale só nesta sessão
  }
}

/** Oceano escuro (padrão) ou Oceano claro. A escolha fica salva neste navegador; o script do <head> a aplica antes da tela aparecer. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("oceano");
  useEffect(() => setTema(lerTema()), []);
  const alternar = useCallback(() => {
    const novo: Tema = tema === "oceano" ? "oceano-claro" : "oceano";
    aplicarTema(novo);
    setTema(novo);
  }, [tema]);
  return { tema, alternar };
}
