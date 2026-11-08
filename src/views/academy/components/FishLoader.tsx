/** Carregamento com um cardume de peixinhos nadando em círculo, com bolhas subindo. */
const css = `
  .fish-loader { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; width:100%; height:100%; min-height:260px; color:#2f7fd8; }
  html[data-tema="oceano"] .fish-loader { color:#9fd2ff; }
  .fish-loader-stage { position:relative; width:112px; height:112px; }
  .fish-loader-ring { position:absolute; inset:0; animation:fish-swim 2.4s linear infinite; }
  .fish-loader-fish { position:absolute; left:50%; top:50%; width:26px; height:16px; margin:-8px 0 0 -13px; }
  .fish-loader-fish svg { display:block; width:100%; height:100%; overflow:visible; filter:drop-shadow(0 0 6px rgba(90,170,255,.45)); animation:fish-wiggle .5s ease-in-out infinite alternate; transform-origin:70% 50%; }
  .fish-loader-fish:nth-child(2) svg { animation-delay:-.1s; }
  .fish-loader-fish:nth-child(3) svg { animation-delay:-.2s; }
  .fish-loader-fish:nth-child(4) svg { animation-delay:-.3s; }
  .fish-loader-fish:nth-child(5) svg { animation-delay:-.4s; }
  .fish-loader-bubble { position:absolute; bottom:38%; width:6px; height:6px; border:1.5px solid currentColor; border-radius:50%; opacity:0; animation:fish-bubble 2.2s ease-in infinite; }
  .fish-loader-bubble:nth-of-type(1) { left:46%; }
  .fish-loader-bubble:nth-of-type(2) { left:54%; width:4px; height:4px; animation-delay:.7s; }
  .fish-loader-bubble:nth-of-type(3) { left:50%; width:5px; height:5px; animation-delay:1.4s; }
  .fish-loader-text { font-size:13px; font-weight:500; letter-spacing:.01em; opacity:.85; }
  .fish-loader-text span { display:inline-block; animation:fish-dot 1.2s ease-in-out infinite; }
  .fish-loader-text span:nth-child(2) { animation-delay:.15s; }
  .fish-loader-text span:nth-child(3) { animation-delay:.3s; }
  @keyframes fish-swim { to { transform:rotate(360deg); } }
  @keyframes fish-wiggle { from { transform:skewY(-6deg) scaleX(.96); } to { transform:skewY(6deg) scaleX(1.02); } }
  @keyframes fish-bubble { 0% { opacity:0; transform:translateY(0) scale(.6); } 20% { opacity:.7; } 100% { opacity:0; transform:translateY(-46px) scale(1.1); } }
  @keyframes fish-dot { 0%, 60%, 100% { opacity:.3; transform:translateY(0); } 30% { opacity:1; transform:translateY(-2px); } }
  @media (prefers-reduced-motion: reduce) {
    .fish-loader-ring, .fish-loader-fish svg, .fish-loader-bubble, .fish-loader-text span { animation:none; }
    .fish-loader-bubble { display:none; }
  }
`;

// Peixe olhando para a direita: no topo do círculo ele nada no sentido horário, o mesmo do giro.
function Peixe({ escala, opacidade }: { escala: number; opacidade: number }) {
  return (
    <svg viewBox="0 0 26 16" style={{ opacity: opacidade, scale: String(escala) }} aria-hidden="true">
      <path d="M7 8 L1 2.5 L2.6 8 L1 13.5 Z" fill="currentColor" opacity=".75" />
      <path d="M5 8 C 9 1.5, 18 1, 25 8 C 18 15, 9 14.5, 5 8 Z" fill="currentColor" />
      <path d="M13 4.6 C 14.6 6.8, 14.6 9.2, 13 11.4" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth=".9" strokeLinecap="round" />
      <circle cx="20.4" cy="6.9" r="1.15" fill="#06213f" />
    </svg>
  );
}

const CARDUME = [
  { angulo: 0, escala: 1, opacidade: 1 },
  { angulo: -38, escala: 0.86, opacidade: 0.8 },
  { angulo: -72, escala: 0.74, opacidade: 0.62 },
  { angulo: -102, escala: 0.62, opacidade: 0.45 },
  { angulo: -128, escala: 0.52, opacidade: 0.3 },
];

export default function FishLoader({ texto = "Carregando arquivo" }: { texto?: string }) {
  return (
    <div className="fish-loader" role="status" aria-live="polite">
      <style>{css}</style>
      <div className="fish-loader-stage">
        <div className="fish-loader-ring">
          {CARDUME.map(({ angulo, escala, opacidade }) => (
            <div key={angulo} className="fish-loader-fish" style={{ transform: `rotate(${angulo}deg) translateY(-40px)` }}>
              <Peixe escala={escala} opacidade={opacidade} />
            </div>
          ))}
        </div>
        <span className="fish-loader-bubble" />
        <span className="fish-loader-bubble" />
        <span className="fish-loader-bubble" />
      </div>
      <div className="fish-loader-text">{texto}<span>.</span><span>.</span><span>.</span></div>
    </div>
  );
}
