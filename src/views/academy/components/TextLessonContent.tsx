import { Fragment, type ReactNode } from "react";

/** Markdown simples das aulas de texto, montado como elementos React (sem HTML cru).
 *  Suporta: # títulos, listas (- e 1.), > citação, ``` bloco de código, ---,
 *  **negrito**, *itálico*, `código`, [link](url) e ![imagem](url). */
export const textLessonCss = `
  .text-lesson { max-width:760px; margin:0 auto; padding:30px 34px 36px; color:#222; font-size:15px; line-height:1.75; }
  .text-lesson h1, .text-lesson h2, .text-lesson h3 { margin:1.6em 0 .55em; color:#111; line-height:1.3; letter-spacing:-.01em; }
  .text-lesson h1 { font-size:24px; } .text-lesson h2 { font-size:20px; } .text-lesson h3 { font-size:17px; }
  .text-lesson > :first-child { margin-top:0; }
  .text-lesson p { margin:0 0 1.05em; }
  .text-lesson ul, .text-lesson ol { margin:0 0 1.05em; padding-left:1.4em; }
  .text-lesson li { margin:.3em 0; }
  .text-lesson blockquote { margin:0 0 1.05em; padding:10px 16px; color:#444; background:#f7f7f7; border-left:3px solid #111; border-radius:0 8px 8px 0; }
  .text-lesson blockquote p:last-child { margin-bottom:0; }
  .text-lesson code { padding:1px 5px; background:#f1f1f1; border:1px solid #e4e4e4; border-radius:4px; font-size:.88em; font-family:ui-monospace,Consolas,monospace; }
  .text-lesson pre { margin:0 0 1.05em; padding:14px 16px; overflow-x:auto; color:#f1f1f1; background:#161616; border-radius:9px; font-size:13px; line-height:1.6; }
  .text-lesson pre code { padding:0; color:inherit; background:none; border:0; font-size:inherit; }
  .text-lesson hr { margin:1.8em 0; border:0; border-top:1px solid #e4e4e4; }
  .text-lesson img { display:block; max-width:100%; margin:0 auto 1.05em; border-radius:9px; }
  .text-lesson a { color:#1f5fd1; text-decoration:underline; text-underline-offset:2px; }
  @media (max-width:700px) { .text-lesson { padding:20px 18px 26px; font-size:14.5px; } }
`;

const LINK_SEGURO = /^(https?:\/\/|mailto:|\/)/i;

function inline(texto: string, chave = "i"): ReactNode[] {
  const partes: ReactNode[] = [];
  const regex = /(!?)\[([^\]]*)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*|_(.+?)_/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = regex.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    const k = `${chave}-${n++}`;
    if (m[3] !== undefined) {
      const url = m[3];
      if (!LINK_SEGURO.test(url)) partes.push(m[0]);
      else if (m[1]) partes.push(<img key={k} src={url} alt={m[2]} loading="lazy" />);
      else partes.push(<a key={k} href={url} target="_blank" rel="noreferrer">{inline(m[2], k)}</a>);
    } else if (m[4] !== undefined) partes.push(<strong key={k}>{inline(m[4], k)}</strong>);
    else if (m[5] !== undefined) partes.push(<code key={k}>{m[5]}</code>);
    else partes.push(<em key={k}>{inline(m[6] ?? m[7], k)}</em>);
    ultimo = regex.lastIndex;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

/** Quebras de linha simples dentro de um parágrafo viram <br>. */
function comQuebras(linhas: string[], chave: string) {
  return linhas.map((l, i) => <Fragment key={i}>{i > 0 && <br />}{inline(l, `${chave}-${i}`)}</Fragment>);
}

function blocos(md: string): ReactNode[] {
  const linhas = md.replace(/\r\n?/g, "\n").split("\n");
  const saida: ReactNode[] = [];
  let i = 0;
  while (i < linhas.length) {
    const linha = linhas[i];
    const k = `b${i}`;
    if (!linha.trim()) { i++; continue; }

    if (linha.trim().startsWith("```")) {
      const codigo: string[] = [];
      i++;
      while (i < linhas.length && !linhas[i].trim().startsWith("```")) codigo.push(linhas[i++]);
      i++;
      saida.push(<pre key={k}><code>{codigo.join("\n")}</code></pre>);
      continue;
    }

    const titulo = linha.match(/^(#{1,3})\s+(.*)$/);
    if (titulo) {
      const Tag = (["h1", "h2", "h3"] as const)[titulo[1].length - 1];
      saida.push(<Tag key={k}>{inline(titulo[2], k)}</Tag>);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,})\s*$/.test(linha.trim())) { saida.push(<hr key={k} />); i++; continue; }

    if (/^>\s?/.test(linha)) {
      const citacao: string[] = [];
      while (i < linhas.length && /^>\s?/.test(linhas[i])) citacao.push(linhas[i++].replace(/^>\s?/, ""));
      saida.push(<blockquote key={k}>{blocos(citacao.join("\n"))}</blockquote>);
      continue;
    }

    const ordenada = /^\s*\d+[.)]\s+/;
    const marcador = /^\s*[-*+]\s+/;
    if (ordenada.test(linha) || marcador.test(linha)) {
      const padrao = ordenada.test(linha) ? ordenada : marcador;
      const itens: string[] = [];
      while (i < linhas.length && padrao.test(linhas[i])) itens.push(linhas[i++].replace(padrao, ""));
      const Lista = padrao === ordenada ? "ol" : "ul";
      saida.push(<Lista key={k}>{itens.map((t, j) => <li key={j}>{inline(t, `${k}-${j}`)}</li>)}</Lista>);
      continue;
    }

    const paragrafo: string[] = [];
    while (
      i < linhas.length && linhas[i].trim() &&
      !/^(#{1,3}\s|>|```|\s*[-*+]\s|\s*\d+[.)]\s)/.test(linhas[i]) && !/^(-{3,}|\*{3,})\s*$/.test(linhas[i].trim())
    ) paragrafo.push(linhas[i++]);
    if (!paragrafo.length) paragrafo.push(linhas[i++]);
    saida.push(<p key={k}>{comQuebras(paragrafo, k)}</p>);
  }
  return saida;
}

/** Minutos de leitura estimados (~200 palavras por minuto). */
export function minutosDeLeitura(md: string) {
  const palavras = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

export default function TextLessonContent({ conteudo }: { conteudo: string }) {
  return (
    <>
      <style>{textLessonCss}</style>
      <div className="text-lesson">{blocos(conteudo)}</div>
    </>
  );
}
