export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Usuário";
}

export function validatePasswordChange(current: string, next: string, confirmation: string) {
  const hasCurrentPassword = current.length > 0;
  const isStrongEnough = next.length >= 8;
  const passwordsMatch = next.length > 0 && next === confirmation;
  return { hasCurrentPassword, isStrongEnough, passwordsMatch, canSave: hasCurrentPassword && isStrongEnough && passwordsMatch };
}
