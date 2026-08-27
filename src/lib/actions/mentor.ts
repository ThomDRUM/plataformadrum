"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/mentor/types";

// ── Overview ──────────────────────────────────────────────────────────────────

export async function updateOverviewField(
  projectId: string,
  field: "intention" | "mwta" | "point_a" | "point_b",
  value: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_overview")
    .update({ [field]: value, updated_at: new Date().toISOString() } as never)
    .eq("project_id", projectId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/projeto");
  return { ok: true };
}

export async function saveOutcomes(projectId: string, texts: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("project_desired_outcomes")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (texts.length > 0) {
    const { error: insertError } = await supabase.from("project_desired_outcomes").insert(
      texts.map((text, i) => ({ project_id: projectId, text, order_index: i }))
    );
    if (insertError) return { ok: false, error: insertError.message };
  }
  revalidatePath("/mentor/projeto");
  return { ok: true };
}

export async function saveRules(
  projectId: string,
  rules: { title: string; description: string }[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("project_rules")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (rules.length > 0) {
    const { error: insertError } = await supabase.from("project_rules").insert(
      rules.map((r, i) => ({ project_id: projectId, title: r.title, description: r.description, order_index: i }))
    );
    if (insertError) return { ok: false, error: insertError.message };
  }
  revalidatePath("/mentor/projeto");
  return { ok: true };
}

export async function saveRoles(
  projectId: string,
  roles: { person_name: string; description: string }[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("project_roles")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (roles.length > 0) {
    const { error: insertError } = await supabase.from("project_roles").insert(
      roles.map((r, i) => ({ project_id: projectId, person_name: r.person_name, description: r.description, order_index: i }))
    );
    if (insertError) return { ok: false, error: insertError.message };
  }
  revalidatePath("/mentor/projeto");
  return { ok: true };
}

export async function updateProjectDates(
  projectId: string,
  startDate: string | null,
  endDate: string | null
) {
  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({ start_date: startDate, end_date: endDate, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  revalidatePath("/mentor/projeto");
  revalidatePath("/mentor/cronograma");
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function saveMeeting(
  projectId: string,
  id: string | null,
  meeting: {
    name: string;
    meeting_date: string | null;
    tipo: string;
    participantes: string;
    proposito: string;
    perguntas_principais: string;
    notas: string;
  }
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const payload = {
    name: meeting.name,
    meeting_date: meeting.meeting_date,
    tipo: meeting.tipo,
    participantes: meeting.participantes,
    proposito: meeting.proposito,
    perguntas_principais: meeting.perguntas_principais,
    notes: meeting.notas,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await supabase.from("project_meetings").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/mentor/alinhamentos");
    revalidatePath("/mentor/cronograma");
    return { ok: true, data: { id } };
  } else {
    const { data, error } = await supabase
      .from("project_meetings")
      .insert({ project_id: projectId, ...payload })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/mentor/alinhamentos");
    revalidatePath("/mentor/cronograma");
    return { ok: true, data };
  }
}

export async function deleteMeeting(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_meetings").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/alinhamentos");
  revalidatePath("/mentor/cronograma");
  return { ok: true };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function updateScheduleItem(
  id: string,
  patch: {
    title?: string;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
    mentor_notes?: string;
  }
) {
  const supabase = await createClient();
  await supabase
    .from("project_schedule")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/mentor/cronograma");
}

export async function addScheduleItem(
  projectId: string,
  orderIndex: number
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_schedule")
    .insert({
      project_id: projectId,
      title: "Nova etapa",
      order_index: orderIndex,
      status: "a_comecar",
    })
    .select("id")
    .single();
  revalidatePath("/mentor/cronograma");
  return data;
}

export async function deleteScheduleItem(id: string) {
  const supabase = await createClient();
  await supabase.from("project_schedule").delete().eq("id", id);
  revalidatePath("/mentor/cronograma");
}

// ── Family ────────────────────────────────────────────────────────────────────

export async function updateFamilyField(
  familyId: string,
  field: "history" | "mission" | "vision" | "values",
  value: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("families")
    .update({ [field]: value, updated_at: new Date().toISOString() } as never)
    .eq("id", familyId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function saveFamilyMember(
  familyId: string,
  member: {
    id: string | null;
    name: string;
    initials: string;
    generation: number;
    family_role: string;
    business_role: string;
    parent_id: string | null;
    works_in_business: boolean;
    notes: string;
    order_index: number;
    spouse_id: string | null;
  }
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  if (member.id) {
    const { id, ...rest } = member;
    const { error } = await supabase
      .from("family_members")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/mentor/familia");
    return { ok: true, data: { id } };
  } else {
    const { id: _id, ...rest } = member;
    const { data, error } = await supabase
      .from("family_members")
      .insert({ family_id: familyId, ...rest })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/mentor/familia");
    return { ok: true, data };
  }
}

export async function deleteFamilyMember(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  // If this member has a spouse, clear the spouse's reference first
  const { data: member } = await supabase
    .from("family_members").select("spouse_id").eq("id", id).single();
  if (member?.spouse_id) {
    const { error } = await supabase
      .from("family_members").update({ spouse_id: null }).eq("id", member.spouse_id);
    if (error) return { ok: false, error: error.message };
  }
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function linkSpouse(id1: string, id2: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: error1 } = await supabase.from("family_members").update({ spouse_id: id2 }).eq("id", id1);
  if (error1) return { ok: false, error: error1.message };
  const { error: error2 } = await supabase.from("family_members").update({ spouse_id: id1 }).eq("id", id2);
  if (error2) return { ok: false, error: error2.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function unlinkSpouse(memberId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("family_members").select("spouse_id").eq("id", memberId).single();
  if (member?.spouse_id) {
    const { error } = await supabase
      .from("family_members").update({ spouse_id: null }).eq("id", member.spouse_id);
    if (error) return { ok: false, error: error.message };
  }
  const { error } = await supabase.from("family_members").update({ spouse_id: null }).eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function swapMemberOrder(
  id1: string, order1: number,
  id2: string, order2: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: error1 } = await supabase.from("family_members").update({ order_index: order2 }).eq("id", id1);
  if (error1) return { ok: false, error: error1.message };
  const { error: error2 } = await supabase.from("family_members").update({ order_index: order1 }).eq("id", id2);
  if (error2) return { ok: false, error: error2.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function updateMemberProfileUrl(memberId: string, profileUrl: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_members")
    .update({ profile_url: profileUrl, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

// ── Governance ────────────────────────────────────────────────────────────────

export async function updateGovernanceItem(
  id: string,
  patch: { has_today?: boolean; wants?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_governance_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

// ── Termômetro ────────────────────────────────────────────────────────────────

export async function saveTermometroPdfUrl(studentId: string, url: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ termometro_pdf_url: url.trim() || null })
    .eq("id", studentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

// ── Assets / Ownership ──────────────────────────────────────────────────────────

export async function saveAsset(
  familyId: string,
  orderIndex: number,
  asset: { name: string; asset_type: string; description: string }
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_assets")
    .insert({
      family_id: familyId,
      name: asset.name,
      asset_type: asset.asset_type,
      description: asset.description,
      order_index: orderIndex,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true, data };
}

export async function updateAsset(
  id: string,
  patch: { name: string; asset_type: string; description: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_assets")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("family_assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function addAssetOwnership(
  assetId: string,
  memberName: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_asset_ownership")
    .insert({ asset_id: assetId, member_name: memberName, percentage: 0 })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true, data };
}

export async function updateAssetOwnershipPercentage(id: string, percentage: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("family_asset_ownership").update({ percentage }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

export async function deleteAssetOwnership(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("family_asset_ownership").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/mentor/familia");
  return { ok: true };
}

// ── Mentorados ────────────────────────────────────────────────────────────────

export async function setModuleUnlockDate(
  userId: string,
  moduleId: string,
  unlockDate: string | null
) {
  const supabase = await createClient();
  await supabase
    .from("user_module_access")
    .upsert(
      { user_id: userId, module_id: moduleId, unlock_date: unlockDate, updated_at: new Date().toISOString() },
      { onConflict: "user_id,module_id" }
    );
  revalidatePath("/mentor/mentorados");
}

export async function setForceUnlocked(
  userId: string,
  moduleId: string,
  mentorId: string,
  force: boolean
) {
  const supabase = await createClient();
  await supabase
    .from("user_module_access")
    .upsert(
      {
        user_id: userId,
        module_id: moduleId,
        force_unlocked: force,
        force_unlocked_by: force ? mentorId : null,
        force_unlocked_at: force ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );
  revalidatePath("/mentor/mentorados");
}

export async function saveMentorNote(answerId: string, mentorId: string, note: string) {
  const supabase = await createClient();
  await supabase.from("mentor_answer_notes").upsert(
    { answer_id: answerId, mentor_id: mentorId, note, updated_at: new Date().toISOString() },
    { onConflict: "answer_id,mentor_id" }
  );
  revalidatePath("/mentor/mentorados");
}
