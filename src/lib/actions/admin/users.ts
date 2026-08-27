"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth/admin";
import { getUserDetail, getUserModuleAccess, getUserEmail } from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";

const ROLES = ["student", "mentor", "admin"] as const;

const createUserSchema = z.object({
  email: z.email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa de pelo menos 6 caracteres."),
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  role: z.enum(ROLES),
  studentType: z.enum(["successor", "succeeded"]).nullable(),
  trailId: z.string().uuid().nullable(),
  projectId: z.string().uuid().nullable(),
  /** role=mentor: projetos que ele passa a atender (derivados dos mentorados escolhidos). */
  mentorProjectIds: z.array(z.string().uuid()).default([]),
  /** role=student: mentores que passam a atender o projeto dele. */
  mentorIds: z.array(z.string().uuid()).default([]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

export async function createUser(
  input: CreateUserInput
): Promise<ActionResult<{ id: string; linkError?: string }>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { email, password, fullName, role, studentType, trailId, projectId, mentorProjectIds, mentorIds } =
    parsed.data;

  try {
    const { db } = await assertAdmin();

    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (authError || !authData.user) {
      return { ok: false, error: authError?.message ?? "Não foi possível criar o usuário." };
    }

    // `upsert` e não `insert`: se o projeto tiver um trigger `on_auth_user_created`
    // populando `profiles`, a linha já existe neste ponto e um insert daria
    // conflito de chave primária.
    const { error: profileError } = await db.from("profiles").upsert(
      {
        id: authData.user.id,
        full_name: fullName,
        role,
        student_type: role === "student" ? studentType : null,
        trail_id: trailId,
        project_id: projectId,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      // O login foi criado mas o perfil falhou — sem isso o usuário loga e cai
      // num estado sem papel. Desfaz para não deixar conta órfã.
      await db.auth.admin.deleteUser(authData.user.id);
      return { ok: false, error: `Perfil não pôde ser criado: ${profileError.message}` };
    }

    // Vínculo mentor↔mentorado. O schema não liga pessoa a pessoa: o mentorado
    // pertence a um projeto (`profiles.project_id`) e o mentor atende projetos
    // (`mentor_projects`). Então, nas duas direções, o vínculo é uma linha em
    // `mentor_projects` — só muda de qual lado vem o projeto.
    const links =
      role === "mentor"
        ? [...new Set(mentorProjectIds)].map((id) => ({
            mentor_id: authData.user.id,
            project_id: id,
          }))
        : role === "student" && projectId
          ? [...new Set(mentorIds)].map((id) => ({ mentor_id: id, project_id: projectId }))
          : [];

    const linkError = links.length > 0 ? await createMentorLinks(db, links) : null;

    revalidatePath("/admin/usuarios");
    if (links.length > 0) revalidatePath("/admin/familias");

    return {
      ok: true,
      data: { id: authData.user.id, ...(linkError ? { linkError } : {}) },
    };
  } catch (error) {
    return fail(error);
  }
}

type MentorLink = { mentor_id: string; project_id: string };

/**
 * Insere os vínculos que ainda não existem e devolve a mensagem de erro, ou
 * `null` em caso de sucesso. Um mentor já pode atender o projeto do mentorado,
 * e a filtragem evita depender de constraint de unicidade em
 * (`mentor_id`, `project_id`).
 */
async function createMentorLinks(
  db: Awaited<ReturnType<typeof assertAdmin>>["db"],
  links: MentorLink[]
): Promise<string | null> {
  const { data: existing, error: readError } = await db
    .from("mentor_projects")
    .select("mentor_id, project_id")
    .in("mentor_id", links.map((l) => l.mentor_id))
    .in("project_id", links.map((l) => l.project_id));

  if (readError) return readError.message;

  const seen = new Set((existing ?? []).map((e) => `${e.mentor_id}:${e.project_id}`));
  const rows = links.filter((l) => !seen.has(`${l.mentor_id}:${l.project_id}`));
  if (rows.length === 0) return null;

  const { error } = await db.from("mentor_projects").insert(rows);
  return error?.message ?? null;
}

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  role: z.enum(ROLES),
  studentType: z.enum(["successor", "succeeded"]).nullable(),
  yearlyIntention: z.string().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { fullName, role, studentType, yearlyIntention } = parsed.data;

  try {
    const { db } = await assertAdmin();

    const { error } = await db
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        student_type: role === "student" ? studentType : null,
        yearly_intention: yearlyIntention?.trim() || null,
      })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export type UserFullDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>> & {
  modules: Awaited<ReturnType<typeof getUserModuleAccess>>;
  email: string | null;
};

/**
 * Tudo que a tela `/admin/usuarios/[id]` mostra (perfil, vínculos, módulos e
 * e-mail), num único fetch — alimenta o dialog de detalhe aberto a partir da
 * listagem, que reaproveita os mesmos componentes daquela tela.
 */
export async function fetchUserFullDetail(userId: string): Promise<ActionResult<UserFullDetail>> {
  try {
    await assertAdmin();

    const detail = await getUserDetail(userId);
    if (!detail) return { ok: false, error: "Usuário não encontrado." };

    const [modules, email] = await Promise.all([
      getUserModuleAccess(userId, detail.profile.trail_id),
      getUserEmail(userId),
    ]);

    return { ok: true, data: { ...detail, modules, email } };
  } catch (error) {
    return fail(error);
  }
}

const updateBasicsSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  role: z.enum(ROLES),
  studentType: z.enum(["successor", "succeeded"]).nullable(),
});

export type UpdateBasicsInput = z.infer<typeof updateBasicsSchema>;

/**
 * Edição rápida a partir da lista: nome, papel e tipo de mentorado.
 *
 * Existe separada de `updateUserProfile` porque aquela também grava
 * `yearly_intention` — chamá-la sem esse campo apagaria a intenção já escrita.
 */
export async function updateUserBasics(
  userId: string,
  input: UpdateBasicsInput
): Promise<ActionResult> {
  const parsed = updateBasicsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { fullName, role, studentType } = parsed.data;

  try {
    const { db } = await assertAdmin();

    const { error } = await db
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        student_type: role === "student" ? studentType : null,
      })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Formação do usuário — `profiles.trail_id`. */
export async function setUserTrail(
  userId: string,
  trailId: string | null
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("profiles").update({ trail_id: trailId }).eq("id", userId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Vincula um mentorado a uma família — na prática, ao projeto dela.
 * `profiles.project_id` é a única ligação pessoa↔família que o schema tem.
 */
export async function setUserProject(
  userId: string,
  projectId: string | null
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("profiles").update({ project_id: projectId }).eq("id", userId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${userId}`);
    revalidatePath("/admin/familias");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Mentor ↔ projeto (N:N). É assim que um mentor passa a atender os mentorados de uma família. */
export async function addMentorToProject(
  mentorId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();

    const { data: existing } = await db
      .from("mentor_projects")
      .select("id")
      .eq("mentor_id", mentorId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (existing) return { ok: true };

    const { error } = await db
      .from("mentor_projects")
      .insert({ mentor_id: mentorId, project_id: projectId });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${mentorId}`);
    revalidatePath("/admin/familias");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function removeMentorFromProject(
  mentorId: string,
  projectId: string
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db
      .from("mentor_projects")
      .delete()
      .eq("mentor_id", mentorId)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    revalidatePath(`/admin/usuarios/${mentorId}`);
    revalidatePath("/admin/familias");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function resetUserPassword(
  userId: string,
  password: string
): Promise<ActionResult> {
  if (password.length < 6) {
    return { ok: false, error: "A senha precisa de pelo menos 6 caracteres." };
  }

  try {
    const { db } = await assertAdmin();
    const { error } = await db.auth.admin.updateUserById(userId, { password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const { db, userId: currentUserId } = await assertAdmin();

    if (userId === currentUserId) {
      return { ok: false, error: "Você não pode excluir a própria conta." };
    }

    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/usuarios");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

// ── Liberação de módulos ──────────────────────────────────────────────────────
// Alimenta a regra de `src/lib/student/access.ts`: o módulo abre se
// `force_unlocked` OU (`unlock_date` <= hoje E o módulo anterior está completo).

export async function setModuleUnlockDate(
  userId: string,
  moduleId: string,
  unlockDate: string | null
): Promise<ActionResult> {
  try {
    const { db } = await assertAdmin();
    const { error } = await db.from("user_module_access").upsert(
      {
        user_id: userId,
        module_id: moduleId,
        unlock_date: unlockDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/usuarios/${userId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setModuleForceUnlocked(
  userId: string,
  moduleId: string,
  force: boolean
): Promise<ActionResult> {
  try {
    const { db, userId: adminId } = await assertAdmin();
    const { error } = await db.from("user_module_access").upsert(
      {
        user_id: userId,
        module_id: moduleId,
        force_unlocked: force,
        force_unlocked_by: force ? adminId : null,
        force_unlocked_at: force ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/usuarios/${userId}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
