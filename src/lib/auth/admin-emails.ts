/**
 * Únicas contas com acesso à área de admin. É a allowlist que decide, não
 * `profiles.role`: uma conta com `role = 'admin'` fora desta lista não entra.
 *
 * Fica fora de `admin.ts` (que é `server-only`) porque o proxy e o formulário
 * de login também precisam dela para decidir para onde mandar após o login.
 */
const ADMIN_EMAILS = ["thom@drumlearning.com", "guel@drumlearning.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
