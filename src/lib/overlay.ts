import type { MouseEvent } from "react";

let pressionadoNoFundo = false;

/** Props para o fundo escuro de um modal: só fecha se o clique começou E terminou no fundo.
 *  Sem isso, selecionar texto num campo e soltar o mouse fora da janelinha fecha o modal. */
export function fecharAoClicarFora(onClose: () => void) {
  return {
    onMouseDown: (e: MouseEvent) => { pressionadoNoFundo = e.target === e.currentTarget; },
    onClick: (e: MouseEvent) => {
      if (pressionadoNoFundo && e.target === e.currentTarget) onClose();
      pressionadoNoFundo = false;
    },
  };
}
