"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/admin";
import {
  revalidateTrailContent,
  revalidateReferenceTrails,
} from "@/lib/admin/revalidate";
import {
  getModuleOverview,
  getTrailOverview,
  type ModuleOverview,
  type TrailOverview,
} from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

function revalidateTrail(trailId: string) {
  revalidateTrailContent(trailId);
  revalidateReferenceTrails();
}

/** Um módulo pode estar em várias formações (N:N) — invalida todas. */
async function revalidateTrailsOfModule(
  db: Awaited<ReturnType<typeof assertAdmin>>["db"],
  moduleId: string
) {
  const { data } = await db.from("trail_modules").select("trail_id").eq("module_id", moduleId);
  for (const row of data ?? []) revalidateTrailContent(row.trail_id);
  revalidateReferenceTrails();
}

// ── Formações (trails) ────────────────────────────────────────────────────────

const trailSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da formação."),
  trailType: z.enum(["successor", "succeeded", "mentor"]),
  intention: z.string().nullable(),
  why: z.string().nullable(),
});

export type TrailInput = z.infer<typeof trailSchema>;

export async function createTrail(input: TrailInput): Promise<ActionResult<{ id: string }>> {
  const parsed = trailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();
    const { data, error } = await db
      .from("trails")
      .insert({
        title: parsed.data.title,
        trail_type: parsed.data.trailType,
        intention: parsed.data.intention?.trim() || null,
        why: parsed.data.why?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Não foi possível criar a formação." };
    }

    revalidatePath("/admin/formacoes");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateTrail(trailId: string, input: TrailInput): Promise<ActionResult> {
  const parsed = trailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("trails")
      .update({
        title: parsed.data.title,
        trail_type: parsed.data.trailType,
        intention: parsed.data.intention?.trim() || null,
        why: parsed.data.why?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trailId);

    if (error) return { ok: false, error: error.message };

    revalidateTrail(trailId);
    revalidatePath("/admin/formacoes");
    revalidatePath(`/admin/formacoes/${trailId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTrail(trailId: string): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    const { count } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("trail_id", trailId);

    if (count && count > 0) {
      return {
        ok: false,
        error: `${count} usuário(s) ainda usam esta formação. Troque a formação deles antes de excluir.`,
      };
    }

    const { error } = await db.from("trails").delete().eq("id", trailId);
    if (error) return { ok: false, error: error.message };

    revalidateTrail(trailId);
    revalidatePath("/admin/formacoes");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Retrato completo da formação, buscado quando o dialog de informações abre —
 * a listagem não carrega os módulos nem quem usa a formação.
 */
export async function fetchTrailOverview(
  trailId: string
): Promise<ActionResult<TrailOverview>> {
  try {
    await assertAdmin();
    const overview = await getTrailOverview(trailId);
    if (!overview) return { ok: false, error: "Formação não encontrada." };
    return { ok: true, data: overview };
  } catch (error) {
    return fail(error);
  }
}

// ── Composição da formação (trail_modules) ────────────────────────────────────

export async function addModuleToTrail(
  trailId: string,
  moduleId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    const { data: existing } = await db
      .from("trail_modules")
      .select("id")
      .eq("trail_id", trailId)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (existing) return { ok: true };

    const { data: last } = await db
      .from("trail_modules")
      .select("order_index")
      .eq("trail_id", trailId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await db.from("trail_modules").insert({
      trail_id: trailId,
      module_id: moduleId,
      order_index: (last?.order_index ?? -1) + 1,
    });

    if (error) return { ok: false, error: error.message };

    revalidateTrail(trailId);
    revalidatePath(`/admin/formacoes/${trailId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function removeModuleFromTrail(
  trailId: string,
  linkId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("trail_modules").delete().eq("id", linkId);
    if (error) return { ok: false, error: error.message };

    revalidateTrail(trailId);
    revalidatePath(`/admin/formacoes/${trailId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Troca a posição de dois módulos dentro da formação. */
export async function swapTrailModuleOrder(
  trailId: string,
  a: { linkId: string; orderIndex: number },
  b: { linkId: string; orderIndex: number }
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    const results = await Promise.all([
      db.from("trail_modules").update({ order_index: b.orderIndex }).eq("id", a.linkId),
      db.from("trail_modules").update({ order_index: a.orderIndex }).eq("id", b.linkId),
    ]);

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return { ok: false, error: firstError.message };

    revalidateTrail(trailId);
    revalidatePath(`/admin/formacoes/${trailId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ── Módulos ───────────────────────────────────────────────────────────────────

const moduleSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do módulo."),
  internalName: z.string().trim(),
  intention: z.string().nullable(),
  why: z.string().nullable(),
});

export type ModuleInput = z.infer<typeof moduleSchema>;

export async function createModule(input: ModuleInput): Promise<ActionResult<{ id: string }>> {
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();
    const { data, error } = await db
      .from("modules")
      .insert({
        title: parsed.data.title,
        internal_name: parsed.data.internalName || parsed.data.title,
        intention: parsed.data.intention?.trim() || null,
        why: parsed.data.why?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Não foi possível criar o módulo." };
    }

    revalidatePath("/admin/modulos");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateModule(
  moduleId: string,
  input: ModuleInput
): Promise<ActionResult> {
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("modules")
      .update({
        title: parsed.data.title,
        internal_name: parsed.data.internalName || parsed.data.title,
        intention: parsed.data.intention?.trim() || null,
        why: parsed.data.why?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    if (error) return { ok: false, error: error.message };

    await revalidateTrailsOfModule(db, moduleId);
    revalidatePath("/admin/modulos");
    revalidatePath(`/admin/modulos/${moduleId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    await revalidateTrailsOfModule(db, moduleId);

    const { error } = await db.from("modules").delete().eq("id", moduleId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/modulos");
    revalidatePath("/admin/formacoes");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Retrato completo do módulo, buscado quando o dialog de informações abre — a
 * listagem não carrega os tópicos.
 */
export async function fetchModuleOverview(
  moduleId: string
): Promise<ActionResult<ModuleOverview>> {
  try {
    await assertAdmin();
    const overview = await getModuleOverview(moduleId);
    if (!overview) return { ok: false, error: "Módulo não encontrado." };
    return { ok: true, data: overview };
  } catch (error) {
    return fail(error);
  }
}

// ── Tópicos ───────────────────────────────────────────────────────────────────

const topicSchema = z.object({
  title: z.string().trim().min(2, "Informe o título do tópico."),
  learningObjective: z.string().nullable(),
  why: z.string().nullable(),
});

export type TopicInput = z.infer<typeof topicSchema>;

export async function createTopic(
  moduleId: string,
  input: TopicInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();

    const { data: last } = await db
      .from("topics")
      .select("order_index")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await db
      .from("topics")
      .insert({
        module_id: moduleId,
        title: parsed.data.title,
        learning_objective: parsed.data.learningObjective?.trim() || null,
        why: parsed.data.why?.trim() || null,
        order_index: (last?.order_index ?? -1) + 1,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Não foi possível criar o tópico." };
    }

    await revalidateTrailsOfModule(db, moduleId);
    revalidatePath(`/admin/modulos/${moduleId}`);
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateTopic(
  topicId: string,
  moduleId: string,
  input: TopicInput
): Promise<ActionResult> {
  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("topics")
      .update({
        title: parsed.data.title,
        learning_objective: parsed.data.learningObjective?.trim() || null,
        why: parsed.data.why?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topicId);

    if (error) return { ok: false, error: error.message };

    await revalidateTrailsOfModule(db, moduleId);
    revalidatePath(`/admin/modulos/${moduleId}`);
    revalidatePath(`/admin/modulos/${moduleId}/topico/${topicId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteTopic(topicId: string, moduleId: string): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("topics").delete().eq("id", topicId);
    if (error) return { ok: false, error: error.message };

    await revalidateTrailsOfModule(db, moduleId);
    revalidatePath(`/admin/modulos/${moduleId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function swapTopicOrder(
  moduleId: string,
  a: { id: string; orderIndex: number },
  b: { id: string; orderIndex: number }
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    const results = await Promise.all([
      db.from("topics").update({ order_index: b.orderIndex }).eq("id", a.id),
      db.from("topics").update({ order_index: a.orderIndex }).eq("id", b.id),
    ]);

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return { ok: false, error: firstError.message };

    await revalidateTrailsOfModule(db, moduleId);
    revalidatePath(`/admin/modulos/${moduleId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
