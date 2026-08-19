"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/admin";
import { sanitizeContentHtml } from "@/lib/admin/sanitize";
import {
  revalidateTopicContent,
  revalidateTrailContent,
  revalidateReferenceTrails,
} from "@/lib/admin/revalidate";
import type { ActionResult } from "@/lib/admin/types";

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

async function revalidateTopic(
  db: Awaited<ReturnType<typeof assertAdmin>>["db"],
  topicId: string,
  moduleId: string
) {
  revalidateTopicContent(topicId);

  const { data } = await db.from("trail_modules").select("trail_id").eq("module_id", moduleId);
  for (const row of data ?? []) revalidateTrailContent(row.trail_id);
  revalidateReferenceTrails();

  revalidatePath(`/admin/modulos/${moduleId}/topico/${topicId}`);
  revalidatePath(`/admin/modulos/${moduleId}`);
}

// ── Repertório ────────────────────────────────────────────────────────────────

const repertoireSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do repertório."),
  contentHtml: z.string(),
});

export type RepertoireInput = z.infer<typeof repertoireSchema>;

/**
 * Um repertório por tópico: o aluno lê o primeiro item (`.limit(1)` nas
 * páginas), então gravamos sempre na mesma linha em vez de acumular itens que
 * ninguém veria.
 */
export async function saveRepertoire(
  topicId: string,
  moduleId: string,
  input: RepertoireInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = repertoireSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const { db } = await assertAdmin();

    const clean = sanitizeContentHtml(parsed.data.contentHtml);

    const { data: existing } = await db
      .from("repertoire_items")
      .select("id")
      .eq("topic_id", topicId)
      .order("order_index")
      .limit(1)
      .maybeSingle();

    const payload = {
      title: parsed.data.title,
      content_type: "text",
      content_html: clean,
      updated_at: new Date().toISOString(),
    };

    let id: string;

    if (existing) {
      const { error } = await db
        .from("repertoire_items")
        .update(payload)
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      id = existing.id;
    } else {
      const { data, error } = await db
        .from("repertoire_items")
        .insert({ ...payload, topic_id: topicId, order_index: 0 })
        .select("id")
        .single();
      if (error || !data) {
        return { ok: false, error: error?.message ?? "Não foi possível salvar o repertório." };
      }
      id = data.id;
    }

    await revalidateTopic(db, topicId, moduleId);
    return { ok: true, data: { id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteRepertoire(
  repertoireId: string,
  topicId: string,
  moduleId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("repertoire_items").delete().eq("id", repertoireId);
    if (error) return { ok: false, error: error.message };

    await revalidateTopic(db, topicId, moduleId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ── Exercício ─────────────────────────────────────────────────────────────────

const exerciseSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do exercício."),
  instructions: z.string().nullable(),
  questions: z.array(
    z.object({
      id: z.string().uuid().nullable(),
      text: z.string().trim().min(1),
    })
  ),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;

/**
 * Salva exercício e perguntas.
 *
 * As perguntas são atualizadas por id, nunca apagadas e reinseridas: as
 * respostas dos alunos (`exercise_answers.question_id`) apontam para elas, e
 * um delete-and-reinsert levaria todo o histórico junto por cascade. Só some
 * o que o autor removeu de fato.
 */
export async function saveExercise(
  topicId: string,
  moduleId: string,
  input: ExerciseInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { title, instructions, questions } = parsed.data;

  try {
    const { db } = await assertAdmin();

    const { data: existing } = await db
      .from("exercises")
      .select("id")
      .eq("topic_id", topicId)
      .order("order_index")
      .limit(1)
      .maybeSingle();

    let exerciseId: string;

    if (existing) {
      const { error } = await db
        .from("exercises")
        .update({
          title,
          instructions: instructions?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      exerciseId = existing.id;
    } else {
      const { data, error } = await db
        .from("exercises")
        .insert({
          topic_id: topicId,
          title,
          instructions: instructions?.trim() || null,
          order_index: 0,
        })
        .select("id")
        .single();
      if (error || !data) {
        return { ok: false, error: error?.message ?? "Não foi possível salvar o exercício." };
      }
      exerciseId = data.id;
    }

    const { data: currentQuestions } = await db
      .from("exercise_questions")
      .select("id")
      .eq("exercise_id", exerciseId);

    const keptIds = new Set(questions.map((q) => q.id).filter((id): id is string => Boolean(id)));
    const removedIds = (currentQuestions ?? [])
      .map((q) => q.id)
      .filter((id) => !keptIds.has(id));

    if (removedIds.length > 0) {
      const { error } = await db.from("exercise_questions").delete().in("id", removedIds);
      if (error) return { ok: false, error: error.message };
    }

    for (const [index, question] of questions.entries()) {
      if (question.id) {
        const { error } = await db
          .from("exercise_questions")
          .update({ question_text: question.text, order_index: index })
          .eq("id", question.id);
        if (error) return { ok: false, error: error.message };
      } else {
        const { error } = await db.from("exercise_questions").insert({
          exercise_id: exerciseId,
          question_text: question.text,
          order_index: index,
        });
        if (error) return { ok: false, error: error.message };
      }
    }

    await revalidateTopic(db, topicId, moduleId);
    return { ok: true, data: { id: exerciseId } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteExercise(
  exerciseId: string,
  topicId: string,
  moduleId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("exercises").delete().eq("id", exerciseId);
    if (error) return { ok: false, error: error.message };

    await revalidateTopic(db, topicId, moduleId);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
