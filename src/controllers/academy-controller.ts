import type { CertificateTraining } from "@/models/certificate";
import type { TrainingDraft } from "@/models/training";
import { issueCertificate } from "@/services/certificate-service";
import { getFirstName, validatePasswordChange } from "@/services/profile-service";
import { sanitizeModules, validateTrainingDraft } from "@/services/training-service";
import { canRegisterUser, isValidCorporateEmail } from "@/services/user-service";

export const academyController = {
  validateUserRegistration: (name: string, email: string) => ({ validEmail: isValidCorporateEmail(email), canSubmit: canRegisterUser(name, email) }),
  validatePasswordChange,
  getFirstName,
  validateTrainingDraft,
  sanitizeModules,
  issueCertificate: (training: CertificateTraining) => issueCertificate(training),
};
