import "server-only";

import { redirect } from "next/navigation";
import { getSessionProfile, type SessionProfile } from "@/lib/auth/session";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin";

/**
 * Modo de teste: com `ADMIN_ALLOW_ANY_USER=true` no .env, qualquer conta
 * autenticada entra na área de admin, sem precisar ter `role = 'admin'`.
 *
 * Existe só para destravar os testes enquanto não há uma conta de admin no
 * banco. **Não deve ir para produção** — enquanto está ligado, qualquer
 * mentorado que descubra a URL cria usuários, apaga famílias e reescreve o
 * conteúdo. Por isso a área mostra um aviso permanente no topo quando a flag
 * está ativa: para ninguém esquecer ligada.
 *
 * Para fechar de novo, remova a linha do .env e reinicie o servidor.
 */
export function isOpenAccessEnabled(): boolean {
  return process.env.ADMIN_ALLOW_ANY_USER === "true";
}

/**
 * Guard de página/layout: manda para `/login` quem não for admin.
 *
 * Reusa `getSessionProfile()`, que é memoizado por request — layout e page
 * dividem a mesma consulta em vez de repetirem `getUser()` + `select`.
 */
export async function requireAdmin(): Promise<SessionProfile> {
  const profile = await getSessionProfile();

  // Sem sessão nunca entra, nem em modo de teste — o proxy já barra antes.
  if (!profile) redirect("/login");

  if (profile.role !== "admin" && !isOpenAccessEnabled()) redirect("/login");

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

  if (profile.role !== "admin" && !isOpenAccessEnabled()) {
    throw new Error("Acesso restrito a administradores.");
  }

  return { db: createAdminClient(), userId: profile.id };
}
