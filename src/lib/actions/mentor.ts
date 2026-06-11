"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Overview ──────────────────────────────────────────────────────────────────

export async function updateOverviewField(
  projectId: string,
  field: "intention" | "mwta" | "point_a" | "point_b",
  value: string
) {
  const supabase = await createClient();
  await supabase
    .from("project_overview")
    .update({ [field]: value, updated_at: new Date().toISOString() } as never)
    .eq("project_id", projectId);
  revalidatePath("/mentor/projeto");
}

export async function saveOutcomes(projectId: string, texts: string[]) {
  const supabase = await createClient();
  await supabase.from("project_desired_outcomes").delete().eq("project_id", projectId);
  if (texts.length > 0) {
    await supabase.from("project_desired_outcomes").insert(
      texts.map((text, i) => ({ project_id: projectId, text, order_index: i }))
    );
  }
  revalidatePath("/mentor/projeto");
}

export async function saveRoles(
  projectId: string,
  roles: { person_name: string; description: string }[]
) {
  const supabase = await createClient();
  await supabase.from("project_roles").delete().eq("project_id", projectId);
  if (roles.length > 0) {
    await supabase.from("project_roles").insert(
      roles.map((r, i) => ({ project_id: projectId, person_name: r.person_name, description: r.description, order_index: i }))
    );
  }
  revalidatePath("/mentor/projeto");
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

export async function saveEvent(
  scheduleId: string,
  id: string | null,
  title: string,
  date: string | null
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  if (id) {
    await supabase
      .from("project_events")
      .update({ title, date: date || null })
      .eq("id", id);
    revalidatePath("/mentor/cronograma");
    return { id };
  } else {
    const { data } = await supabase
      .from("project_events")
      .insert({ schedule_id: scheduleId, title, date: date || null })
      .select("id")
      .single();
    revalidatePath("/mentor/cronograma");
    return data;
  }
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  await supabase.from("project_events").delete().eq("id", id);
  revalidatePath("/mentor/cronograma");
}

// ── Family ────────────────────────────────────────────────────────────────────

export async function updateFamilyField(
  familyId: string,
  field: "history" | "mission" | "vision" | "values",
  value: string
) {
  const supabase = await createClient();
  await supabase
    .from("families")
    .update({ [field]: value, updated_at: new Date().toISOString() } as never)
    .eq("id", familyId);
  revalidatePath("/mentor/familia");
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
  }
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  if (member.id) {
    const { id, ...rest } = member;
    await supabase
      .from("family_members")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id);
    revalidatePath("/mentor/familia");
    return { id };
  } else {
    const { id: _id, ...rest } = member;
    const { data } = await supabase
      .from("family_members")
      .insert({ family_id: familyId, ...rest })
      .select("id")
      .single();
    revalidatePath("/mentor/familia");
    return data;
  }
}

export async function deleteFamilyMember(id: string) {
  const supabase = await createClient();
  await supabase.from("family_members").delete().eq("id", id);
  revalidatePath("/mentor/familia");
}
