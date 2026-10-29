import { useCallback, useEffect, useState } from "react";

export type Tema = "claro" | "oceano";

const CHAVE = "nexa-tema";

function lerTema(): Tema {
  try {
    return localStorage.getItem(CHAVE) === "oceano" ? "oceano" : "claro";
  } catch {
    return "claro";
  }
}

function aplicarTema(tema: Tema) {
  if (tema === "oceano") document.documentElement.dataset.tema = "oceano";
  else delete document.documentElement.dataset.tema;
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // sem armazenamento: o tema vale só nesta sessão
  }
}

/** Tema claro (padrão) ou Oceano. A escolha fica salva neste navegador; o script do <head> a aplica antes da tela aparecer. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("claro");
  useEffect(() => setTema(lerTema()), []);
  const alternar = useCallback(() => {
    const novo: Tema = tema === "oceano" ? "claro" : "oceano";
    aplicarTema(novo);
    setTema(novo);
  }, [tema]);
  return { tema, alternar };
}
