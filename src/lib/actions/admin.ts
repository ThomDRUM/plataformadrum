"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, userId: user.id };
}

// ── MENTORADOS ────────────────────────────────────────────────────────────────

export async function createMentorado(formData: FormData) {
  const { supabase } = await assertAdmin();

  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const password = formData.get("password") as string;
  const trailId = formData.get("trail_id") as string || null;
  const yearlyIntention = formData.get("yearly_intention") as string || null;

  // Create auth user with admin API (via service role not available client-side)
  // Use signUp — admin will set password, user must change on first login
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "student" },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Erro ao criar usuário." };
  }

  // Update profile with trail and intention
  await supabase.from("profiles").update({
    trail_id: trailId,
    yearly_intention: yearlyIntention,
  }).eq("id", authData.user.id);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateMentorado(userId: string, formData: FormData) {
  const { supabase } = await assertAdmin();

  await supabase.from("profiles").update({
    full_name: formData.get("full_name") as string,
    trail_id: (formData.get("trail_id") as string) || null,
    yearly_intention: (formData.get("yearly_intention") as string) || null,
  }).eq("id", userId);

  revalidatePath("/admin");
  revalidatePath(`/admin/mentorados/${userId}`);
}

export async function setModuleStatus(userId: string, moduleId: string, status: string) {
  const { supabase } = await assertAdmin();

  await supabase.from("user_module_status").upsert(
    { user_id: userId, module_id: moduleId, status, updated_at: new Date().toISOString() },
    { onConflict: "user_id,module_id" }
  );

  revalidatePath(`/admin/mentorados/${userId}`);
}

export async function createAchievement(userId: string, formData: FormData) {
  const { supabase } = await assertAdmin();

  const { data: last } = await supabase
    .from("achievements")
    .select("order_index")
    .eq("user_id", userId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("achievements").insert({
    user_id: userId,
    title: formData.get("title") as string,
    order_index: (last?.order_index ?? -1) + 1,
  });

  revalidatePath(`/admin/mentorados/${userId}`);
}

export async function deleteAchievement(userId: string, achievementId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("achievements").delete().eq("id", achievementId);
  revalidatePath(`/admin/mentorados/${userId}`);
}

// ── TRAILS ────────────────────────────────────────────────────────────────────

export async function createTrail(formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("trails").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
  });
  revalidatePath("/admin/trilhas");
  redirect("/admin/trilhas");
}

export async function updateTrail(id: string, formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("trails").update({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
  }).eq("id", id);
  revalidatePath("/admin/trilhas");
  redirect("/admin/trilhas");
}

export async function deleteTrail(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("trails").delete().eq("id", id);
  revalidatePath("/admin/trilhas");
}

// ── MODULES ───────────────────────────────────────────────────────────────────

export async function createModule(formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("modules").insert({
    trail_id: formData.get("trail_id") as string,
    title: formData.get("title") as string,
    short_context: (formData.get("short_context") as string) || null,
    order_index: parseInt(formData.get("order_index") as string) || 0,
  });
  revalidatePath("/admin/modulos");
  redirect("/admin/modulos");
}

export async function updateModule(id: string, formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("modules").update({
    trail_id: formData.get("trail_id") as string,
    title: formData.get("title") as string,
    short_context: (formData.get("short_context") as string) || null,
    order_index: parseInt(formData.get("order_index") as string) || 0,
  }).eq("id", id);
  revalidatePath("/admin/modulos");
  redirect("/admin/modulos");
}

export async function deleteModule(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("modules").delete().eq("id", id);
  revalidatePath("/admin/modulos");
}

// ── COMPETENCIES ──────────────────────────────────────────────────────────────

export async function createCompetency(formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("competencies").insert({
    module_id: formData.get("module_id") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    order_index: parseInt(formData.get("order_index") as string) || 0,
  });
  revalidatePath("/admin/competencias");
  redirect("/admin/competencias");
}

export async function updateCompetency(id: string, formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("competencies").update({
    module_id: formData.get("module_id") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    order_index: parseInt(formData.get("order_index") as string) || 0,
  }).eq("id", id);
  revalidatePath("/admin/competencias");
  redirect("/admin/competencias");
}

export async function deleteCompetency(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("competencies").delete().eq("id", id);
  revalidatePath("/admin/competencias");
}

// ── REPERTOIRE ────────────────────────────────────────────────────────────────

export async function createRepertoireItem(formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("repertoire_items").insert({
    competency_id: formData.get("competency_id") as string,
    title: formData.get("title") as string,
    short_summary: (formData.get("description") as string) || null,
    type: formData.get("type") as string,
    external_url: (formData.get("external_url") as string) || null,
    content_html: (formData.get("content_html") as string) || null,
  });
  revalidatePath("/admin/repertorio");
  redirect("/admin/repertorio");
}

export async function updateRepertoireItem(id: string, formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("repertoire_items").update({
    competency_id: formData.get("competency_id") as string,
    title: formData.get("title") as string,
    short_summary: (formData.get("description") as string) || null,
    type: formData.get("type") as string,
    external_url: (formData.get("external_url") as string) || null,
    content_html: (formData.get("content_html") as string) || null,
  }).eq("id", id);
  revalidatePath("/admin/repertorio");
  redirect("/admin/repertorio");
}

export async function deleteRepertoireItem(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("repertoire_items").delete().eq("id", id);
  revalidatePath("/admin/repertorio");
}

// ── REFLECTIONS ───────────────────────────────────────────────────────────────

export async function createReflection(formData: FormData) {
  const { supabase } = await assertAdmin();
  const { data } = await supabase.from("reflections").insert({
    competency_id: formData.get("competency_id") as string,
    title: formData.get("title") as string,
    context: (formData.get("context") as string) || null,
  }).select().single();

  if (data) {
    // Parse and create questions
    const questionsRaw = formData.get("questions") as string;
    if (questionsRaw) {
      const questions = JSON.parse(questionsRaw) as string[];
      await supabase.from("reflection_questions").insert(
        questions
          .filter((q) => q.trim())
          .map((q, i) => ({ reflection_id: data.id, question_text: q, order_index: i }))
      );
    }
  }
  revalidatePath("/admin/reflexoes");
  redirect("/admin/reflexoes");
}

export async function updateReflection(id: string, formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("reflections").update({
    competency_id: formData.get("competency_id") as string,
    title: formData.get("title") as string,
    context: (formData.get("context") as string) || null,
  }).eq("id", id);

  // Replace questions
  const questionsRaw = formData.get("questions") as string;
  if (questionsRaw !== null) {
    await supabase.from("reflection_questions").delete().eq("reflection_id", id);
    const questions = JSON.parse(questionsRaw) as string[];
    if (questions.length > 0) {
      await supabase.from("reflection_questions").insert(
        questions
          .filter((q) => q.trim())
          .map((q, i) => ({ reflection_id: id, question_text: q, order_index: i }))
      );
    }
  }
  revalidatePath("/admin/reflexoes");
  redirect("/admin/reflexoes");
}

export async function deleteReflection(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("reflections").delete().eq("id", id);
  revalidatePath("/admin/reflexoes");
}

// ── DELIVERABLES ──────────────────────────────────────────────────────────────

export async function createDeliverable(formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("deliverables").insert({
    competency_id: formData.get("competency_id") as string,
    title: formData.get("title") as string,
    instructions_html: (formData.get("instructions_html") as string) || null,
  });
  revalidatePath("/admin/entregas");
  redirect("/admin/entregas");
}

export async function updateDeliverable(id: string, formData: FormData) {
  const { supabase } = await assertAdmin();
  await supabase.from("deliverables").update({
    competency_id: formData.get("competency_id") as string,
    title: formData.get("title") as string,
    instructions_html: (formData.get("instructions_html") as string) || null,
  }).eq("id", id);
  revalidatePath("/admin/entregas");
  redirect("/admin/entregas");
}

export async function deleteDeliverable(id: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("deliverables").delete().eq("id", id);
  revalidatePath("/admin/entregas");
}

export async function updateSubmissionStatus(submissionId: string, status: string, userId: string) {
  const { supabase } = await assertAdmin();
  await supabase.from("deliverable_submissions").update({ status }).eq("id", submissionId);
  revalidatePath(`/admin/mentorados/${userId}`);
}
