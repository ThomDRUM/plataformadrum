"use server";

import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    // Expose the real Supabase error to help diagnose
    return { error: error.message };
  }

  if (!data.session || !data.user) {
    return { error: "Sessão não criada. Verifique suas credenciais." };
  }

  // Use user from signInWithPassword directly — avoids extra network call
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role;
  const redirectTo = role === "admin" ? "/admin" : role === "mentor" ? "/mentor/projeto" : "/";
  return { redirectTo };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { redirectTo: "/login" };
}
