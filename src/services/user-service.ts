export const CORPORATE_EMAIL_DOMAIN = "@ciahering.com.br";

export function isValidCorporateEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return normalized.endsWith(CORPORATE_EMAIL_DOMAIN) && normalized.length > CORPORATE_EMAIL_DOMAIN.length;
}

export function canRegisterUser(name: string, email: string): boolean {
  return name.trim().length > 1 && isValidCorporateEmail(email);
}
