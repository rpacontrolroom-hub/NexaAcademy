import type { CertificateTemplate, CertificateTraining } from "@/models/certificate";
import { Download, X } from "lucide-react";

interface CertificatePreviewModalProps {
  recipientName: string;
  template: CertificateTemplate;
  training: CertificateTraining;
  onClose: () => void;
}

const certificateCss = `
  .certificate-overlay {
    position:fixed; inset:0; z-index:80; display:flex; align-items:center; justify-content:center;
    padding:24px; background:rgba(17,17,17,.52); backdrop-filter:blur(4px);
  }
  .certificate-dialog { width:min(1080px, calc(100vw - 48px)); max-height:calc(100vh - 48px); overflow:auto; }
  .certificate-pages { display:flex; flex-direction:column; gap:14px; }
  .certificate-sheet {
    position:relative; width:100%; aspect-ratio:10693400 / 7556500; overflow:hidden;
    color:#111; background:#f6f9fd url('/certificates/certificate-background.png') center/cover no-repeat;
    box-shadow:0 28px 80px rgba(0,0,0,.28); font-family:Arial,Helvetica,sans-serif;
  }
  .certificate-main {
    box-shadow:inset 0 0 0 3px #0b5275, inset 0 0 0 14px #f6f9fd, inset 0 0 0 16px #8bcaf5;
  }
  .certificate-new-header {
    position:absolute; top:3.5%; left:3.15%; right:3.15%; height:20.3%; border-radius:10px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-align:center;
  }
  .certificate-new-title { margin:0; font-size:clamp(30px,4.3vw,66px); font-weight:900; line-height:.9; letter-spacing:-.075em; }
  .certificate-new-type { margin-top:1.3%; color:#9ecff1; font-size:clamp(13px,1.95vw,29px); font-weight:300; letter-spacing:-.05em; }
  .certificate-new-body {
    position:absolute; top:31.8%; left:8%; right:8%; bottom:5%; display:flex; flex-direction:column; align-items:center; text-align:center;
  }
  .certificate-new-kicker { color:#6b7e98; font-size:clamp(11px,1.55vw,23px); }
  .certificate-new-recipient {
    margin-top:2.8%; color:#075791; font:700 clamp(22px,4.15vw,62px)/1 Georgia,'Times New Roman',serif;
  }
  .certificate-new-rule { width:38%; height:3px; margin:2.7% 0 3.5%; background:linear-gradient(90deg,#94cff7 0 25%,#075791 25% 75%,#94cff7 75%); }
  .certificate-new-copy { max-width:92%; color:#35455d; font-size:clamp(10px,1.65vw,24px); line-height:1.38; }
  .certificate-new-copy strong { color:#075791; font-weight:500; }
  .certificate-new-date { margin-top:3.1%; color:#60728c; font-size:clamp(9px,1.2vw,18px); }
  .certificate-new-footer {
    position:absolute; left:8.5%; right:8.5%; bottom:4.8%; display:grid; grid-template-columns:1fr 1.7fr 1fr; align-items:end; gap:5%;
  }
  .certificate-new-brand { height:clamp(45px,7vw,100px); display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .certificate-new-brand img { width:100%; height:100%; object-fit:contain; }
  .certificate-new-brand:first-child img { max-width:92px; }
  .certificate-new-brand:last-child img { max-width:66px; }
  .certificate-new-signature { min-width:0; text-align:center; color:#075791; }
  .certificate-new-signature img { display:block; width:clamp(52px,7.4vw,106px); height:clamp(34px,5.4vw,76px); object-fit:contain; margin:0 auto -5px; }
  .certificate-new-signature-line { height:2px; background:#075791; }
  .certificate-new-signer { margin-top:1.4%; font-size:clamp(9px,1.5vw,22px); }
  .certificate-new-role { margin-top:.8%; color:#64748b; font-size:clamp(7px,1vw,15px); white-space:nowrap; }
  .certificate-new-code { position:absolute; right:2.3%; bottom:1.4%; color:#8794a6; font:600 clamp(6px,.65vw,9px)/1 monospace; }
  .certificate-program-sheet { padding:12% 6.2% 8%; background:#fff; }
  .certificate-program-title { margin:0 0 3.6%; font-size:clamp(15px,2vw,30px); font-weight:500; }
  .certificate-program-grid { display:grid; grid-template-columns:1fr 1fr; gap:8%; }
  .certificate-program-list { margin:0; padding-left:1.7em; font-size:clamp(10px,1.55vw,23px); line-height:1.78; }
  .certificate-program-score { margin-top:3.5%; font-size:clamp(12px,1.75vw,26px); }
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

export default function CertificatePreviewModal({ recipientName, template, training, onClose }: CertificatePreviewModalProps) {
  const splitIndex = Math.ceil(template.programContent.length / 2);
  const firstColumn = template.programContent.slice(0, splitIndex);
  const secondColumn = template.programContent.slice(splitIndex);

  return (
    <div className="certificate-overlay" onClick={onClose} role="presentation">
      <style>{certificateCss}</style>
      <div className="certificate-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="certificate-pages">
          <article className="certificate-sheet certificate-main" aria-label={`Certificado do curso ${training.titulo}`}>
            <header className="certificate-new-header" style={{ background: template.accentColor }}>
              <h2 className="certificate-new-title">CERTIFICADO</h2>
              <div className="certificate-new-type">{template.typeLabel}</div>
            </header>

            <section className="certificate-new-body">
              <div className="certificate-new-kicker">CERTIFICAMOS QUE</div>
              <div className="certificate-new-recipient">{recipientName}</div>
              <div className="certificate-new-rule" />
              <div className="certificate-new-copy">
                concluiu com êxito o treinamento <strong>{training.titulo}</strong>, disponibilizado pela área
                CoE RPA, Agentic AI &amp; Processos AZZAS, com carga horária de <strong>{training.cargaHoraria}</strong>.
              </div>
              <div className="certificate-new-date">{training.dataEmissao}</div>
            </section>

            <footer className="certificate-new-footer">
              <div className="certificate-new-brand"><img src="/certificates/hering-logo.png" alt="Hering" /></div>
              <div className="certificate-new-signature">
                <img src="/certificates/certificate-signature.png" alt={`Assinatura de ${template.signerName}`} />
                <div className="certificate-new-signature-line" />
                <div className="certificate-new-signer">{template.signerName}</div>
                <div className="certificate-new-role">{template.signerRole}</div>
              </div>
              <div className="certificate-new-brand"><img src="/certificates/nexa-certificate-logo.png" alt="Nexa Academy" /></div>
            </footer>
            <div className="certificate-new-code">Código: {training.codigo}</div>
          </article>

          <article className="certificate-sheet certificate-program-sheet" aria-label={`Conteúdo programático de ${training.titulo}`}>
            <h3 className="certificate-program-title">Conteúdo programático:</h3>
            <div className="certificate-program-grid">
              <ol className="certificate-program-list">
                {firstColumn.map((item) => <li key={item}>{item}</li>)}
              </ol>
              <ol className="certificate-program-list" start={splitIndex + 1}>
                {secondColumn.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </div>
            <div className="certificate-program-score">Aproveitamento: {training.aproveitamento}%</div>
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

