import type { CertificateTraining } from "@/models/certificate";

export const MINIMUM_CERTIFICATE_SCORE = 90;

export function isCertificateEligible(training: CertificateTraining): boolean {
  return training.progresso === 100 && training.aproveitamento !== null && training.aproveitamento >= MINIMUM_CERTIFICATE_SCORE;
}

export function issueCertificate(training: CertificateTraining, now = new Date(), random = Math.random): CertificateTraining {
  if (!isCertificateEligible(training) || training.emitido) return training;
  const number = Math.floor(10000 + random() * 89999);
  return {
    ...training,
    emitido: true,
    codigo: `NXA-${now.getFullYear()}-${number}`,
    dataEmissao: now.toLocaleDateString("pt-BR"),
  };
}

/** Carga horária por extenso, como no modelo: "62 horas", "1 hora e 30 minutos", "45 minutos". */
export function formatCertificateHours(minutes: number | undefined, fallback = ""): string {
  if (minutes === undefined || !Number.isFinite(minutes) || minutes <= 0) return fallback;
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const horas = h === 1 ? "1 hora" : `${h} horas`;
  const minutos = m === 1 ? "1 minuto" : `${m} minutos`;
  if (h === 0) return minutos;
  return m === 0 ? horas : `${horas} e ${minutos}`;
}
