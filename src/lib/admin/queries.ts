import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Client de leitura da área de admin.
 *
 * Prefere o service-role: o admin, por definição, enxerga tudo, e depender de
 * RLS aqui tem um modo de falha ruim — uma policy restritiva devolve lista
 * vazia em vez de erro, e a tela parece quebrada sem dizer por quê. Todas as
 * chamadas ficam atrás de `requireAdmin()` no layout de `(admin)`.
 *
 * Sem a chave configurada, cai para o client da sessão: a área continua
 * navegável (dentro do que a RLS permitir) em vez de ficar totalmente
 * inacessível.
 */
const readClient = cache(async () => {
  try {
    return createAdminClient();
  } catch {
    return await createClient();
  }
});

/**
 * O e-mail vive em `auth.users`, não em `profiles`, então só a service role
 * enxerga. Falha em silêncio: sem a chave configurada a tela ainda funciona,
 * só não mostra o e-mail.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data } = await createAdminClient().auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

// Leituras da área de admin. As escritas ficam em `src/lib/actions/admin/*`.

export interface AdminUserRow {
  id: string;
  fullName: string;
  role: string;
  studentType: string | null;
  trailTitle: string | null;
  familyName: string | null;
  projectId: string | null;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const supabase = await readClient();

  const [{ data: profiles }, { data: trails }, { data: projects }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, student_type, trail_id, project_id")
      .order("full_name"),
    supabase.from("trails").select("id, title"),
    supabase.from("projects").select("id, families(name)"),
  ]);

  // `profiles.trail_id` não tem FK declarada no banco, então o join aninhado do
  // PostgREST não funciona nesse campo — resolvemos em memória.
  const trailById = new Map((trails ?? []).map((t) => [t.id, t.title]));
  const familyByProject = new Map(
    (projects ?? []).map((p) => [
      p.id,
      (p.families as { name: string } | null)?.name ?? null,
    ])
  );

  return (profiles ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    role: p.role,
    studentType: p.student_type,
    trailTitle: p.trail_id ? trailById.get(p.trail_id) ?? null : null,
    familyName: p.project_id ? familyByProject.get(p.project_id) ?? null : null,
    projectId: p.project_id,
  }));
}

export async function getUserDetail(userId: string) {
  const supabase = await readClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, student_type, trail_id, project_id, yearly_intention, identified_need_summary"
    )
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const [{ data: trails }, { data: families }, { data: mentorProjects }] = await Promise.all([
    supabase.from("trails").select("id, title, trail_type").order("title"),
    supabase.from("families").select("id, name, projects(id, name)").order("name"),
    supabase.from("mentor_projects").select("id, project_id").eq("mentor_id", userId),
  ]);

  return {
    profile,
    trails: trails ?? [],
    families: (families ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      projects: (f.projects as { id: string; name: string }[] | null) ?? [],
    })),
    mentorProjectIds: (mentorProjects ?? []).map((mp) => mp.project_id),
  };
}

export interface ModuleAccessRow {
  moduleId: string;
  title: string;
  orderIndex: number;
  unlockDate: string | null;
  forceUnlocked: boolean;
}

/** Módulos da formação do usuário, com o estado de liberação de cada um. */
export async function getUserModuleAccess(
  userId: string,
  trailId: string | null
): Promise<ModuleAccessRow[]> {
  if (!trailId) return [];

  const supabase = await readClient();

  const [{ data: trailModules }, { data: access }] = await Promise.all([
    supabase
      .from("trail_modules")
      .select("order_index, modules(id, title)")
      .eq("trail_id", trailId)
      .order("order_index"),
    supabase
      .from("user_module_access")
      .select("module_id, unlock_date, force_unlocked")
      .eq("user_id", userId),
  ]);

  const accessByModule = new Map((access ?? []).map((a) => [a.module_id, a]));

  return (trailModules ?? []).flatMap((tm) => {
    const mod = tm.modules as { id: string; title: string } | null;
    if (!mod) return [];
    const a = accessByModule.get(mod.id);
    return [
      {
        moduleId: mod.id,
        title: mod.title,
        orderIndex: tm.order_index,
        unlockDate: a?.unlock_date ?? null,
        forceUnlocked: a?.force_unlocked === true,
      },
    ];
  });
}

export async function listFamilies() {
  const supabase = await readClient();

  const { data } = await supabase
    .from("families")
    .select("id, name, business_name, projects(id, name, status), family_members(count)")
    .order("name");

  return (data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    businessName: f.business_name,
    projects: (f.projects as { id: string; name: string; status: string }[] | null) ?? [],
    memberCount: (f.family_members as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function getFamilyDetail(familyId: string) {
  const supabase = await readClient();

  const { data: family } = await supabase
    .from("families")
    .select("id, name, business_name, history, mission, vision, values")
    .eq("id", familyId)
    .single();

  if (!family) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, start_date, end_date, duration_months")
    .eq("family_id", familyId)
    .order("created_at");

  const projectIds = (projects ?? []).map((p) => p.id);

  const [{ data: students }, { data: mentorLinks }, { data: allProfiles }] = await Promise.all([
    projectIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, role, student_type, project_id")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] as never[] }),
    projectIds.length
      ? supabase
          .from("mentor_projects")
          .select("id, mentor_id, project_id, profiles(id, full_name)")
          .in("project_id", projectIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("profiles").select("id, full_name, role, project_id").order("full_name"),
  ]);

  return {
    family,
    projects: projects ?? [],
    students: (students ?? []).filter((p) => p.role === "student"),
    mentorLinks: (mentorLinks ?? []).map((m) => ({
      id: m.id,
      mentorId: m.mentor_id,
      projectId: m.project_id,
      name: (m.profiles as { full_name: string } | null)?.full_name ?? "—",
    })),
    allProfiles: allProfiles ?? [],
  };
}

export async function listTrails() {
  const supabase = await readClient();

  const { data } = await supabase
    .from("trails")
    .select("id, title, trail_type, intention, why, trail_modules(count)")
    .order("title");

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    trailType: t.trail_type,
    intention: t.intention,
    why: t.why,
    moduleCount: (t.trail_modules as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function getTrailDetail(trailId: string) {
  const supabase = await readClient();

  const { data: trail } = await supabase
    .from("trails")
    .select("id, title, trail_type, intention, why")
    .eq("id", trailId)
    .single();

  if (!trail) return null;

  const [{ data: trailModules }, { data: allModules }] = await Promise.all([
    supabase
      .from("trail_modules")
      .select("id, order_index, module_id, modules(id, title, internal_name)")
      .eq("trail_id", trailId)
      .order("order_index"),
    supabase.from("modules").select("id, title, internal_name").order("title"),
  ]);

  return {
    trail,
    modules: (trailModules ?? []).flatMap((tm) => {
      const mod = tm.modules as { id: string; title: string; internal_name: string } | null;
      if (!mod) return [];
      return [
        {
          linkId: tm.id,
          moduleId: mod.id,
          title: mod.title,
          internalName: mod.internal_name,
          orderIndex: tm.order_index,
        },
      ];
    }),
    allModules: allModules ?? [],
  };
}

export async function listModules() {
  const supabase = await readClient();

  const { data } = await supabase
    .from("modules")
    .select("id, title, internal_name, intention, topics(count), trail_modules(trails(title))")
    .order("title");

  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    internalName: m.internal_name,
    intention: m.intention,
    topicCount: (m.topics as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    trailTitles: ((m.trail_modules as { trails: { title: string } | null }[] | null) ?? [])
      .map((tm) => tm.trails?.title)
      .filter((t): t is string => Boolean(t)),
  }));
}

export async function getModuleDetail(moduleId: string) {
  const supabase = await readClient();

  const { data: mod } = await supabase
    .from("modules")
    .select("id, title, internal_name, intention, why")
    .eq("id", moduleId)
    .single();

  if (!mod) return null;

  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, learning_objective, order_index, repertoire_items(count), exercises(count)")
    .eq("module_id", moduleId)
    .order("order_index");

  return {
    module: mod,
    topics: (topics ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      learningObjective: t.learning_objective,
      orderIndex: t.order_index,
      hasRepertoire:
        ((t.repertoire_items as unknown as { count: number }[] | null)?.[0]?.count ?? 0) > 0,
      hasExercise: ((t.exercises as unknown as { count: number }[] | null)?.[0]?.count ?? 0) > 0,
    })),
  };
}

export async function getTopicDetail(topicId: string) {
  const supabase = await readClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, module_id, title, learning_objective, why, order_index")
    .eq("id", topicId)
    .single();

  if (!topic) return null;

  const [{ data: repertoire }, { data: exercises }] = await Promise.all([
    supabase
      .from("repertoire_items")
      .select("id, title, content_type, content_html, youtube_url, order_index")
      .eq("topic_id", topicId)
      .order("order_index")
      .limit(1),
    supabase
      .from("exercises")
      .select("id, title, instructions, order_index")
      .eq("topic_id", topicId)
      .order("order_index")
      .limit(1),
  ]);

  const exercise = exercises?.[0] ?? null;

  const { data: questions } = exercise
    ? await supabase
        .from("exercise_questions")
        .select("id, question_text, order_index")
        .eq("exercise_id", exercise.id)
        .order("order_index")
    : { data: [] as { id: string; question_text: string; order_index: number }[] };

  return {
    topic,
    repertoire: repertoire?.[0] ?? null,
    exercise,
    questions: questions ?? [],
  };
}
