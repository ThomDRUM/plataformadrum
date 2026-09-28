import "server-only";

import { redirect } from "next/navigation";
import { getAuthUser, getSessionProfile, type SessionProfile } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";

/**
 * Guard de página/layout: manda para `/login` quem não tem sessão e para `/`
 * quem está logado com um e-mail fora da allowlist de `admin-emails.ts`.
 *
 * Reusa `getSessionProfile()` e `getAuthUser()`, memoizados por request —
 * layout e page dividem a mesma consulta em vez de repetirem `getUser()` + `select`.
 */
export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const user = await getAuthUser();
  if (!isAdminEmail(user?.email)) redirect("/");

  return profile;
}

/**
 * Guard de Server Action. Valida o acesso e devolve o client service-role para
 * escrita — nessa ordem, sempre: nada escreve antes da checagem passar.
 *
 * Lança em vez de redirecionar porque uma action precisa devolver o erro para
 * quem chamou, não trocar a navegação por baixo do usuário.
 */
export async function assertAdmin(): Promise<{ db: AdminClient; userId: string }> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Sessão expirada. Faça login novamente.");

  const user = await getAuthUser();
  if (!isAdminEmail(user?.email)) {
    throw new Error("Acesso restrito a administradores.");
  }

  return { db: createAdminClient(), userId: profile.id };
}
