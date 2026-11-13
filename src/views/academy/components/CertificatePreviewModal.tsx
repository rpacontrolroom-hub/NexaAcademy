import type { CertificateTraining } from "@/models/certificate";
import { formatCertificateHours } from "@/services/certificate-service";
import { Download, X } from "lucide-react";

interface CertificatePreviewModalProps {
  recipientName: string;
  training: CertificateTraining;
  onClose: () => void;
}

/*
 * Modelo único de certificado (public/certificates/modelo-certificado-base.pptx).
 * Posições em % do slide (10693400 x 7556500 EMU, A4 deitado) e fontes em cqw
 * (1pt = 100/842 cqw), para a folha escalar igual na tela e no PDF.
 */
const certificateCss = `
  .certificate-overlay {
    position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center;
    padding:24px; background:rgba(17,17,17,.52); backdrop-filter:blur(4px);
  }
  .certificate-dialog { width:min(1080px, calc(100vw - 48px)); max-height:calc(100vh - 48px); overflow:auto; }
  .certificate-pages { display:flex; flex-direction:column; gap:14px; }
  .certificate-sheet {
    position:relative; width:100%; aspect-ratio:10693400 / 7556500; overflow:hidden; container-type:inline-size;
    background:#fff; color:#000; box-shadow:0 28px 80px rgba(0,0,0,.28);
    font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .certificate-sheet > * { position:absolute; margin:0; }
  .certificate-front { background:#fff url('/certificates/certificate-background.png') center/100% 100% no-repeat; }
  .cert-frame-outer {
    left:.724%; top:1.088%; width:98.367%; height:97.033%;
    border:.267cqw solid #004B85; border-radius:1.12cqw; box-sizing:border-box;
  }
  .cert-frame-inner {
    left:2.023%; top:2.527%; width:95.908%; height:94.155%;
    border:.134cqw solid #A0D3FC; border-radius:.75cqw; box-sizing:border-box;
  }
  .cert-header-band { left:3.145%; top:4.810%; width:93.735%; height:20.211%; background:#004B85; border-radius:.762cqw; }
  .cert-header-text {
    left:2.042%; top:4.810%; width:95.075%; height:22.230%;
    display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;
  }
  .cert-title { color:#fff; font:800 4.823cqw/1.2 Montserrat,'Arial Black',sans-serif; }
  .cert-type { margin-top:.476cqw; color:#A0D3FC; font:500 2.031cqw/1.2 Montserrat,Arial,sans-serif; }
  .cert-box { display:flex; align-items:center; justify-content:center; text-align:center; }
  .cert-kicker { left:8.907%; top:30.882%; width:82.214%; height:4.411%; color:#64748B; font-size:1.544cqw; }
  .cert-name {
    left:8.907%; top:35.924%; width:82.214%; height:9.453%;
    color:#004B85; font-family:Georgia,'Times New Roman',serif; font-weight:700; line-height:1.1;
  }
  .cert-rule-light { left:32.155%; top:46.891%; width:35.719%; height:.377%; background:#A0D3FC; }
  .cert-rule-dark { left:41.063%; top:46.891%; width:17.904%; height:.377%; background:#004B85; }
  .cert-copy {
    left:10.689%; top:49.790%; width:78.651%; height:15.126%;
    color:#334155; font-size:1.900cqw; font-weight:300; line-height:1.2;
  }
  .cert-copy .cert-hl { color:#004B85; font-weight:400; }
  .cert-copy .cert-area { font-weight:400; }
  .cert-copy .cert-nowrap { white-space:nowrap; }
  .cert-date { left:41.063%; top:66.176%; width:17.904%; height:3.152%; color:#64748B; font-size:1.425cqw; }
  .cert-signature { left:43.290%; top:68.067%; width:13.362%; height:13.868%; object-fit:cover; }
  .cert-signature-line { left:36.609%; top:81.302%; width:26.722%; height:.178cqw; background:#004B85; }
  .cert-signer { left:27.702%; top:82.563%; width:44.627%; height:3.529%; color:#004B85; font-size:1.781cqw; }
  .cert-role { left:23.248%; top:86.092%; width:53.534%; height:3.152%; color:#64748B; font-size:1.425cqw; }
  .cert-logo { left:9.798%; top:80.672%; width:6.680%; height:9.453%; object-fit:contain; }
  .cert-code { right:2.6%; bottom:.9%; color:#8794a6; font:600 .75cqw/1 monospace; }
  .cert-back-body { left:6.193%; top:16.704%; right:6.2%; bottom:6%; }
  .cert-back-title { font-size:1.900cqw; line-height:1.4; }
  .cert-back-list {
    margin:2.05cqw 0 0; padding:0; list-style:none; columns:2; column-gap:3.4cqw;
    font-size:1.559cqw; font-weight:300; line-height:1.4;
  }
  .cert-back-list li { break-inside:avoid; }
  .cert-back-score { margin-top:2.9cqw; font-size:1.900cqw; line-height:1.4; }
  .certificate-actions { display:flex; justify-content:flex-end; gap:10px; padding:14px; margin-top:0; background:#fff; border-top:1px solid #e5e5e5; }
  .certificate-action {
    min-height:40px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:0 18px;
    border:1px solid #d8d8d8; border-radius:7px; background:#fff; color:#111; font:600 13px Inter,sans-serif; cursor:pointer;
  }
  .certificate-action.primary { background:#111; border-color:#111; color:#fff; }
  @media (max-width:680px) {
    .certificate-overlay { padding:12px; align-items:flex-start; }
    .certificate-dialog { width:calc(100vw - 24px); max-height:calc(100vh - 24px); }
    .certificate-sheet { min-width:680px; }
  }
`;

/** 40pt como no modelo; nomes longos encolhem para caber em uma linha. */
function nameFontSize(name: string): string {
  const size = Math.min(4.75, 82 / (Math.max(name.trim().length, 1) * 0.6));
  return `${Math.max(size, 2.4).toFixed(3)}cqw`;
}

export default function CertificatePreviewModal({ recipientName, training, onClose }: CertificatePreviewModalProps) {
  const cargaHoraria = formatCertificateHours(training.cargaHorariaMinutos, training.cargaHoraria);
  const modulos = (training.modulos ?? []).filter((titulo) => titulo.trim());

  return (
    <div className="certificate-overlay" onClick={onClose} role="presentation">
      <style>{certificateCss}</style>
      <div className="certificate-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="certificate-pages">
          <article className="certificate-sheet certificate-front" aria-label={`Certificado do treinamento ${training.titulo}`}>
            <div className="cert-frame-outer" />
            <div className="cert-frame-inner" />
            <div className="cert-header-band" />
            <header className="cert-header-text">
              <h2 className="cert-title">CERTIFICADO</h2>
              <div className="cert-type">DE CONCLUSÃO</div>
            </header>

            <div className="cert-box cert-kicker">CERTIFICAMOS QUE</div>
            <div className="cert-box cert-name" style={{ fontSize: nameFontSize(recipientName) }}>{recipientName}</div>
            <div className="cert-rule-light" />
            <div className="cert-rule-dark" />
            <p className="cert-box cert-copy">
              <span>
                concluiu com êxito o treinamento <span className="cert-hl">{training.titulo}</span>, disponibilizado pela área{" "}
                <span className="cert-area">CoE Hiperautomação &amp; Processos</span>
                {cargaHoraria && <>, com carga horária de <span className="cert-hl cert-nowrap">{cargaHoraria}</span></>}.
              </span>
            </p>
            <div className="cert-box cert-date">{training.dataEmissao}</div>

            <img className="cert-signature" src="/certificates/certificate-signature.png" alt="Assinatura de Rael P. Borges" />
            <div className="cert-signature-line" />
            <div className="cert-box cert-signer">Rael P. Borges</div>
            <div className="cert-box cert-role">Coordenador CoE Hiperautomação &amp; Processos</div>
            <img className="cert-logo" src="/certificates/hering-logo.png" alt="Hering" />
            {training.codigo && <div className="cert-code">Código: {training.codigo}</div>}
          </article>

          <article className="certificate-sheet" aria-label="Conteúdo programático">
            <div className="cert-back-body">
              <div className="cert-back-title">Conteúdo programático:</div>
              <ol className="cert-back-list">
                {modulos.map((titulo, i) => <li key={i}>{i + 1}. {titulo}</li>)}
              </ol>
              {training.aproveitamento !== null && (
                <div className="cert-back-score">Aproveitamento: {Math.round(training.aproveitamento)}%</div>
              )}
            </div>
          </article>
        </div>

        <div className="certificate-actions nexa-no-print">
          <button className="certificate-action" type="button" onClick={onClose}><X size={15} /> Fechar</button>
          <button className="certificate-action primary" type="button" onClick={() => window.print()}><Download size={15} /> Baixar PDF</button>
        </div>
      </div>
    </div>
  );
}
