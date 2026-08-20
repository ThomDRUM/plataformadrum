"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/admin";
import { getFamilyOverview, type FamilyOverview } from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

const createFamilySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da família."),
  businessName: z.string().trim(),
  projectName: z.string().trim().min(2, "Informe o nome do projeto."),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;

/**
 * Cria a família e o projeto juntos.
 *
 * O projeto é a ponte de todos os vínculos — `profiles.project_id` para
 * mentorados e `mentor_projects` para mentores. Uma família sem projeto não
 * recebe ninguém, então criar os dois separadamente só produziria estados
 * inúteis.
 */
export async function createFamily(
  input: CreateFamilyInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createFamilySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, businessName, projectName } = parsed.data;

  try {
    const { db } = await assertAdmin();

    const { data: family, error: familyError } = await db
      .from("families")
      .insert({ name, business_name: businessName })
      .select("id")
      .single();

    if (familyError || !family) {
      return { ok: false, error: familyError?.message ?? "Não foi possível criar a família." };
    }

    const { error: projectError } = await db
      .from("projects")
      .insert({ family_id: family.id, name: projectName, status: "active" });

    if (projectError) {
      await db.from("families").delete().eq("id", family.id);
      return { ok: false, error: `Projeto não pôde ser criado: ${projectError.message}` };
    }

    revalidatePath("/admin/familias");
    return { ok: true, data: { id: family.id } };
  } catch (error) {
    return fail(error);
  }
}

const familyFields = ["name", "business_name", "history", "mission", "vision", "values"] as const;
type FamilyField = (typeof familyFields)[number];

export async function updateFamilyField(
  familyId: string,
  field: FamilyField,
  value: string
): Promise<ActionResult> {
  if (!familyFields.includes(field)) {
    return { ok: false, error: "Campo inválido." };
  }

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("families")
      // Chave dinâmica não passa pelo tipo gerado — mesmo `as never` usado em
      // `updateOverviewField` de src/lib/actions/mentor.ts.
      .update({ [field]: value, updated_at: new Date().toISOString() } as never)
      .eq("id", familyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/familias");
    revalidatePath(`/admin/familias/${familyId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Retrato completo da família, buscado quando o dialog de informações ou o
 * sheet de edição abre — a listagem não carrega esses campos.
 */
export async function fetchFamilyOverview(
  familyId: string
): Promise<ActionResult<FamilyOverview>> {
  try {
    await assertAdmin();
    const overview = await getFamilyOverview(familyId);
    if (!overview) return { ok: false, error: "Família não encontrada." };
    return { ok: true, data: overview };
  } catch (error) {
    return fail(error);
  }
}

const updateContentSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da família."),
  businessName: z.string().trim(),
  history: z.string(),
  mission: z.string(),
  vision: z.string(),
  values: z.string(),
});

export type UpdateFamilyContentInput = z.infer<typeof updateContentSchema>;

/**
 * Grava os campos da família de uma vez.
 *
 * Substitui a sequência de `updateFamilyField` campo a campo que a aba "Dados"
 * fazia: um único update, então ou tudo entra ou nada entra.
 */
export async function updateFamilyContent(
  familyId: string,
  input: UpdateFamilyContentInput
): Promise<ActionResult> {
  const parsed = updateContentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, businessName, history, mission, vision, values } = parsed.data;

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("families")
      .update({
        name,
        business_name: businessName,
        history,
        mission,
        vision,
        values,
        updated_at: new Date().toISOString(),
      })
      .eq("id", familyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/familias");
    revalidatePath(`/admin/familias/${familyId}`);
    revalidatePath("/mentor/familia");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteFamily(familyId: string): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("families").delete().eq("id", familyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/familias");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

const projectSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do projeto."),
  status: z.enum(["active", "paused", "completed"]),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  durationMonths: z.number().int().positive().nullable(),
});

export type UpdateProjectInput = z.infer<typeof projectSchema>;

export async function updateProject(
  projectId: string,
  familyId: string,
  input: UpdateProjectInput
): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, status, startDate, endDate, durationMonths } = parsed.data;

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("projects")
      .update({
        name,
        status,
        start_date: startDate,
        end_date: endDate,
        duration_months: durationMonths,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/familias");
    revalidatePath(`/admin/familias/${familyId}`);
    revalidatePath("/mentor/projeto");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function createProject(
  familyId: string,
  name: string
): Promise<ActionResult> {
  if (name.trim().length < 2) {
    return { ok: false, error: "Informe o nome do projeto." };
  }

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("projects")
      .insert({ family_id: familyId, name: name.trim(), status: "active" });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/familias");
    revalidatePath(`/admin/familias/${familyId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
