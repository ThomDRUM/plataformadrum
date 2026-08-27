"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/admin";
import {
  getFamilyDetail,
  getFamilyOverview,
  type FamilyOverview,
} from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";
import { initials } from "@/lib/utils";

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

/**
 * Membro da árvore genealógica. `family_role` e `business_role` são texto livre
 * ("Fundador", "CEO") — é assim que a tela do mentor os trata.
 */
const memberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do membro."),
  familyRole: z.string().trim(),
  businessRole: z.string().trim(),
  generation: z.number().int().min(1, "A geração começa em 1.").max(9),
  worksInBusiness: z.boolean(),
});

export type FamilyMemberInput = z.infer<typeof memberSchema>;

const createFamilySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da família."),
  businessName: z.string().trim(),
  projectName: z.string().trim().min(2, "Informe o nome do projeto."),
  members: z.array(memberSchema).default([]),
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
): Promise<ActionResult<{ id: string; memberError?: string }>> {
  const parsed = createFamilySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, businessName, projectName, members } = parsed.data;

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

    // A árvore genealógica é acessória: se ela falhar, a família e o projeto já
    // estão de pé e os membros podem ser adicionados na edição — desfazer tudo
    // custaria mais do que avisar.
    let memberError: string | null = null;
    if (members.length > 0) {
      const { error } = await db
        .from("family_members")
        .insert(members.map((member, index) => memberRow(family.id, member, index)));
      memberError = error?.message ?? null;
    }

    revalidatePath("/admin/familias");
    return {
      ok: true,
      data: { id: family.id, ...(memberError ? { memberError } : {}) },
    };
  } catch (error) {
    return fail(error);
  }
}

/**
 * `order_index` é a ordem editorial da árvore dentro da geração (ver CLAUDE.md),
 * então a posição na lista do formulário é a posição na árvore. `initials`
 * alimenta o avatar da tela do mentor e sai do nome.
 */
function memberRow(familyId: string, member: FamilyMemberInput, orderIndex: number) {
  return {
    family_id: familyId,
    name: member.name,
    initials: initials(member.name),
    family_role: member.familyRole,
    business_role: member.worksInBusiness ? member.businessRole : "",
    generation: member.generation,
    works_in_business: member.worksInBusiness,
    order_index: orderIndex,
  };
}

export interface FamilyMemberRow {
  id: string;
  name: string;
  familyRole: string;
  businessRole: string;
  generation: number;
  worksInBusiness: boolean;
}

/** Adiciona um membro à árvore de uma família que já existe. */
export async function addFamilyMember(
  familyId: string,
  input: FamilyMemberInput
): Promise<ActionResult<{ member: FamilyMemberRow }>> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();

    // Entra no fim da própria geração, para não empurrar quem já está na árvore.
    const { data: last } = await db
      .from("family_members")
      .select("order_index")
      .eq("family_id", familyId)
      .eq("generation", parsed.data.generation)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await db
      .from("family_members")
      .insert(memberRow(familyId, parsed.data, (last?.order_index ?? -1) + 1))
      .select("id, name, family_role, business_role, generation, works_in_business")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Não foi possível adicionar o membro." };
    }

    revalidatePath("/admin/familias");
    revalidatePath(`/admin/familias/${familyId}`);
    revalidatePath("/mentor/familia");

    return {
      ok: true,
      data: {
        member: {
          id: data.id,
          name: data.name,
          familyRole: data.family_role,
          businessRole: data.business_role,
          generation: data.generation,
          worksInBusiness: data.works_in_business,
        },
      },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function removeFamilyMember(
  familyId: string,
  memberId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    // `parent_id` e `spouse_id` apontam para `family_members`: sem soltar quem
    // referencia o removido, o delete bate na FK (ou levaria filhos junto).
    await db.from("family_members").update({ spouse_id: null }).eq("spouse_id", memberId);
    await db.from("family_members").update({ parent_id: null }).eq("parent_id", memberId);

    // `family_id` no filtro: o id do membro vem do cliente, e a remoção só pode
    // alcançar a árvore da família que está aberta.
    const { error } = await db
      .from("family_members")
      .delete()
      .eq("id", memberId)
      .eq("family_id", familyId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/familias");
    revalidatePath(`/admin/familias/${familyId}`);
    revalidatePath("/mentor/familia");
    return { ok: true };
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

export type FamilyFullDetail = NonNullable<Awaited<ReturnType<typeof getFamilyDetail>>>;

/**
 * Tudo que a tela `/admin/familias/[id]` mostra (família, projetos, vínculos e
 * a lista de perfis dos selects), num único fetch — alimenta o dialog de
 * detalhe aberto a partir da listagem, que reaproveita as abas daquela tela.
 */
export async function fetchFamilyFullDetail(
  familyId: string
): Promise<ActionResult<FamilyFullDetail>> {
  try {
    await assertAdmin();
    const detail = await getFamilyDetail(familyId);
    if (!detail) return { ok: false, error: "Família não encontrada." };
    return { ok: true, data: detail };
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
