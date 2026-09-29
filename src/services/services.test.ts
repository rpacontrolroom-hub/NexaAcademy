import { describe, expect, test } from "bun:test";
import type { CertificateTemplateDraft, CertificateTraining } from "@/models/certificate";
import { createCertificateTemplate, isCertificateEligible, issueCertificate, resolveCertificateTemplate } from "./certificate-service";
import { defaultCertificateTemplates } from "@/mocks/certificate-templates";
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

  test("seleciona um modelo específico para cada curso", () => {
    const training: CertificateTraining = { titulo: "Blue Prism Avançado", categoria: "Blue Prism", cargaHoraria: "3h20", progresso: 100, aproveitamento: 96, emitido: false, codigo: null, dataEmissao: null };
    const template = resolveCertificateTemplate(training, defaultCertificateTemplates);
    expect(template?.id).toBe("cert-blue-prism-avancado");
    expect(template?.typeLabel).toBe("DE CONCLUSÃO");
  });

  test("valida e cria modelos cadastrados pelo administrador", () => {
    const draft: CertificateTemplateDraft = {
      name: "Certificado de APIs",
      courseTitle: "APIs REST com FastAPI",
      typeLabel: "de integrações",
      accentColor: "#334155",
      minimumScore: 90,
      signerName: "Coordenação Nexa Academy",
      signerRole: "Coordenação de Gestão de Processos & RPA",
      programContent: ["Fundamentos de APIs", "Integrações"],
      sourceFileName: "modelo-api.pptx",
      status: "active",
    };
    const template = createCertificateTemplate(draft, new Date("2026-07-16T12:00:00Z"), () => 0);
    expect(template?.id).toBe("cert-apis-rest-com-fastapi-1000");
    expect(template?.typeLabel).toBe("DE INTEGRAÇÕES");
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
