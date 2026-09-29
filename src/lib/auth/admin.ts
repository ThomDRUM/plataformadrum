import "server-only";

import { redirect } from "next/navigation";
import { getSessionProfile, type SessionProfile } from "@/lib/auth/session";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";

/**
 * Guard de página/layout: manda para `/login` quem não tem sessão e para `/`
 * quem está logado sem `profiles.role = 'admin'`.
 *
 * Reusa `getSessionProfile()`, memoizado por request — layout e page dividem a
 * mesma consulta em vez de repetirem `getUser()` + `select`.
 */
export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  if (profile.role !== "admin") redirect("/");

  return profile;
}

/**
 * Guard de Server Action. Valida o papel e devolve o client service-role para
 * escrita — nessa ordem, sempre: nada escreve antes da checagem passar.
 *
 * Lança em vez de redirecionar porque uma action precisa devolver o erro para
 * quem chamou, não trocar a navegação por baixo do usuário.
 */
export async function assertAdmin(): Promise<{ db: AdminClient; userId: string }> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Sessão expirada. Faça login novamente.");

  if (profile.role !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }

  return { db: createAdminClient(), userId: profile.id };
}
