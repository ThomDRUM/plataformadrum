"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";

/** Retorno padrão das Server Actions de Configurações. */
export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

export async function updateOwnProfile(fullName: string): Promise<ActionResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const trimmed = fullName.trim();
  if (trimmed.length < 2) return { ok: false, error: "Informe um nome válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function updateOwnPassword(newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 6) {
    return { ok: false, error: "A senha deve ter ao menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
