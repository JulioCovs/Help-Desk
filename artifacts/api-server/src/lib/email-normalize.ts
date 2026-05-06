/** Email estable para comparar en SQL y en código (único en BD usuarios). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
