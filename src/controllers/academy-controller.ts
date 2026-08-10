import type { CertificateTemplate, CertificateTemplateDraft, CertificateTraining } from "@/models/certificate";
import type { TrainingDraft } from "@/models/training";
import {
  createCertificatePreviewTraining,
  createCertificateTemplate,
  issueCertificate,
  registerCertificateTemplate,
  resolveCertificateTemplate,
  toggleCertificateTemplateStatus,
  validateCertificateTemplateDraft,
} from "@/services/certificate-service";
import { getFirstName, validatePasswordChange } from "@/services/profile-service";
import { sanitizeModules, validateTrainingDraft } from "@/services/training-service";
import { canRegisterUser, isValidCorporateEmail } from "@/services/user-service";

export const academyController = {
  validateUserRegistration: (name: string, email: string) => ({ validEmail: isValidCorporateEmail(email), canSubmit: canRegisterUser(name, email) }),
  validatePasswordChange,
  getFirstName,
  validateTrainingDraft,
  sanitizeModules,
  issueCertificate: (training: CertificateTraining, template?: CertificateTemplate) => issueCertificate(training, new Date(), Math.random, template),
  resolveCertificateTemplate: (training: CertificateTraining, templates: CertificateTemplate[]) => resolveCertificateTemplate(training, templates),
  validateCertificateTemplateDraft: (draft: CertificateTemplateDraft) => validateCertificateTemplateDraft(draft),
  createCertificateTemplate: (draft: CertificateTemplateDraft) => createCertificateTemplate(draft),
  createCertificatePreviewTraining: (template: CertificateTemplate) => createCertificatePreviewTraining(template),
  registerCertificateTemplate: (templates: CertificateTemplate[], template: CertificateTemplate) => registerCertificateTemplate(templates, template),
  toggleCertificateTemplateStatus: (templates: CertificateTemplate[], templateId: string) => toggleCertificateTemplateStatus(templates, templateId),
};
