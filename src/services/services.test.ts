import { describe, expect, test } from "bun:test";
import type { CertificateTraining } from "@/models/certificate";
import { formatCertificateHours, isCertificateEligible, issueCertificate } from "./certificate-service";
import { validatePasswordChange } from "./profile-service";
import { canRegisterUser, isValidCorporateEmail } from "./user-service";
import { canOpenModule, getLessonContext } from "./course-service";
import { onboardingCourse } from "@/mocks/course-detail";
import { lessonDetails } from "@/mocks/lesson-detail";

describe("regras da academia", () => {
  test("aceita somente e-mail corporativo com usuário", () => {
    expect(isValidCorporateEmail("maria.silva@ciahering.com.br")).toBe(true);
    expect(isValidCorporateEmail("@ciahering.com.br")).toBe(false);
    expect(canRegisterUser("Maria da Silva", "maria.silva@gmail.com")).toBe(false);
  });

  test("valida alteração de senha", () => {
    expect(validatePasswordChange("atual", "12345678", "12345678").canSave).toBe(true);
    expect(validatePasswordChange("atual", "curta", "curta").canSave).toBe(false);
  });

  test("emite certificado somente para treinamento elegível", () => {
    const training: CertificateTraining = { titulo: "Curso", categoria: "RPA", cargaHoraria: "1h", progresso: 100, aproveitamento: 95, emitido: false, codigo: null, dataEmissao: null };
    expect(isCertificateEligible(training)).toBe(true);
    const issued = issueCertificate(training, new Date("2026-07-15T12:00:00Z"), () => 0);
    expect(issued.emitido).toBe(true);
    expect(issued.codigo).toBe("NXA-2026-10000");
  });

  test("escreve a carga horária por extenso no certificado", () => {
    expect(formatCertificateHours(3720)).toBe("62 horas");
    expect(formatCertificateHours(90)).toBe("1 hora e 30 minutos");
    expect(formatCertificateHours(45)).toBe("45 minutos");
    expect(formatCertificateHours(0, "2h")).toBe("2h");
  });

  test("impede acesso a módulos bloqueados", () => {
    expect(canOpenModule(onboardingCourse.modules[2])).toBe(true);
    expect(canOpenModule(onboardingCourse.modules[3])).toBe(false);
  });

  test("coordena a aula atual e a navegação entre aulas", () => {
    const context = getLessonContext(onboardingCourse, "3.4", lessonDetails);
    expect(context?.detail.title).toBe("Blue Prism Avançado");
    expect(context?.previousLesson?.id).toBe("3.3");
    expect(context?.nextLesson?.id).toBe("3.5");
  });
});
