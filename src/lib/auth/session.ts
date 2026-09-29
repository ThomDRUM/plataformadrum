import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface SessionProfile {
  id: string;
  fullName: string;
  role: string;
  trailId: string | null;
  projectId: string | null;
  studentType: string | null;
}

/**
 * `auth.getUser()` é um round-trip de rede para a Auth API a cada chamada.
 * Memoizar por request faz layout, page e helpers dividirem uma única chamada.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Usuário autenticado + linha de `profiles`, memoizado por request.
 * Substitui o par `getUser()` + `select("profiles")` que era refeito
 * independentemente no layout e em cada page.
 */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, trail_id, project_id, student_type")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    trailId: profile.trail_id,
    projectId: profile.project_id,
    studentType: profile.student_type,
  };
});
