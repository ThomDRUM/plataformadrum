import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type AdminClient = SupabaseClient<Database>;

let cached: AdminClient | null = null;

/**
 * Client com a chave `service_role`: ignora RLS por completo e dá acesso à
 * Auth Admin API (criar usuário, trocar senha) e ao Storage.
 *
 * Só pode ser usado depois de `assertAdmin()` — a autorização deixa de ser
 * responsabilidade do banco e passa a ser do guard. O `server-only` acima faz
 * o build quebrar se alguém importar isto de um componente client, que é o
 * único jeito de a chave vazar para o navegador.
 */
export function createAdminClient(): AdminClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não está configurada. " +
        "Copie a chave `service_role` em Supabase → Settings → API para o .env " +
        "e reinicie o servidor de desenvolvimento."
    );
  }

  cached = createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
