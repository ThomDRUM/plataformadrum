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
  /** `null` quando não deu para consultar o Auth — ver `fetchActiveByUserId`. */
  isActive: boolean | null;
}

/**
 * Quem está com a conta desativada.
 *
 * `profiles` não guarda esse estado: quem não consegue entrar é quem está
 * banido no Auth (`banned_until` no futuro). Precisa de service role — sem a
 * chave, devolve `null` e a coluna mostra "—" em vez de afirmar "Ativo" para
 * todo mundo.
 */
async function fetchActiveByUserId(): Promise<Map<string, boolean> | null> {
  try {
    const admin = createAdminClient();
    const active = new Map<string, boolean>();
    const now = new Date();

    // O Auth pagina em 50 por padrão, o que truncaria a lista em silêncio.
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return null;

      for (const user of data.users) {
        const bannedUntil = user.banned_until;
        active.set(user.id, !bannedUntil || new Date(bannedUntil) <= now);
      }

      if (!data.nextPage) break;
      page = data.nextPage;
    }

    return active;
  } catch {
    return null;
  }
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const supabase = await readClient();

  const [{ data: profiles }, { data: trails }, { data: projects }, activeByUser] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role, student_type, trail_id, project_id")
        .order("full_name"),
      supabase.from("trails").select("id, title"),
      supabase.from("projects").select("id, families(name)"),
      fetchActiveByUserId(),
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
    // Perfil sem conta no Auth não entra na plataforma, então conta como inativo.
    isActive: activeByUser ? activeByUser.get(p.id) ?? false : null,
  }));
}

/**
 * Opções dos selects do formulário de novo usuário. Fica aqui porque duas
 * telas montam esse formulário: a rota `/admin/usuarios/novo` e o sheet que
 * abre de dentro da lista.
 */
export async function listUserFormOptions() {
  const supabase = await readClient();

  const [{ data: trails }, { data: families }] = await Promise.all([
    supabase.from("trails").select("id, title, trail_type").order("title"),
    supabase.from("families").select("id, name, projects(id)").order("name"),
  ]);

  return {
    trails: trails ?? [],
    families: (families ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      projectId: (f.projects as { id: string }[] | null)?.[0]?.id ?? null,
    })),
  };
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

export interface AdminFamilyRow {
  id: string;
  name: string;
  businessName: string | null;
  projects: { id: string; name: string; status: string }[];
  memberCount: number;
}

export async function listFamilies(): Promise<AdminFamilyRow[]> {
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

export interface FamilyOverview {
  family: {
    id: string;
    name: string;
    businessName: string;
    history: string;
    mission: string;
    vision: string;
    values: string;
  };
  projects: {
    id: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    durationMonths: number | null;
  }[];
  students: { id: string; name: string; studentType: string | null }[];
  mentors: { id: string; name: string }[];
  members: {
    id: string;
    name: string;
    familyRole: string;
    businessRole: string;
    generation: number;
    worksInBusiness: boolean;
  }[];
}

/**
 * Retrato completo da família para leitura — alimenta o dialog de informações
 * aberto da listagem.
 *
 * Difere de `getFamilyDetail` em dois pontos: traz `family_members` (a árvore
 * genealógica, que a tela de edição não usa) e dispensa `allProfiles` — aquela
 * lista existe só para popular os selects de vínculo, e são todos os perfis da
 * plataforma.
 */
export async function getFamilyOverview(familyId: string): Promise<FamilyOverview | null> {
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

  const [{ data: linkedProfiles }, { data: mentorLinks }, { data: members }] =
    await Promise.all([
      projectIds.length
        ? supabase
            .from("profiles")
            .select("id, full_name, role, student_type")
            .in("project_id", projectIds)
            .order("full_name")
        : Promise.resolve({ data: [] as never[] }),
      projectIds.length
        ? supabase
            .from("mentor_projects")
            .select("mentor_id, profiles(id, full_name)")
            .in("project_id", projectIds)
        : Promise.resolve({ data: [] as never[] }),
      supabase
        .from("family_members")
        .select("id, name, family_role, business_role, generation, works_in_business")
        .eq("family_id", familyId)
        // Ordem editorial da árvore, não alfabética — ver CLAUDE.md.
        .order("generation")
        .order("order_index"),
    ]);

  return {
    family: {
      id: family.id,
      name: family.name,
      businessName: family.business_name,
      history: family.history,
      mission: family.mission,
      vision: family.vision,
      values: family.values,
    },
    projects: (projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      startDate: p.start_date,
      endDate: p.end_date,
      durationMonths: p.duration_months,
    })),
    students: (linkedProfiles ?? [])
      .filter((p) => p.role === "student")
      .map((p) => ({ id: p.id, name: p.full_name, studentType: p.student_type })),
    mentors: (mentorLinks ?? []).map((m) => ({
      id: m.mentor_id,
      name: (m.profiles as { full_name: string } | null)?.full_name ?? "—",
    })),
    members: (members ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      familyRole: m.family_role,
      businessRole: m.business_role,
      generation: m.generation,
      worksInBusiness: m.works_in_business,
    })),
  };
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

export interface AdminTrailRow {
  id: string;
  title: string;
  trailType: string;
  intention: string | null;
  why: string | null;
  moduleCount: number;
  /** Perfis com esta formação atribuída — é o que trava a exclusão. */
  userCount: number;
}

export async function listTrails(): Promise<AdminTrailRow[]> {
  const supabase = await readClient();

  const [{ data: trails }, { data: profiles }] = await Promise.all([
    supabase
      .from("trails")
      .select("id, title, trail_type, intention, why, trail_modules(count)")
      .order("title"),
    // `profiles.trail_id` não tem FK declarada no banco, então o join aninhado
    // do PostgREST não funciona nesse campo — contamos em memória (mesmo caso
    // de `listUsers`).
    supabase.from("profiles").select("trail_id"),
  ]);

  const usersByTrail = new Map<string, number>();
  for (const profile of profiles ?? []) {
    if (!profile.trail_id) continue;
    usersByTrail.set(profile.trail_id, (usersByTrail.get(profile.trail_id) ?? 0) + 1);
  }

  return (trails ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    trailType: t.trail_type,
    intention: t.intention,
    why: t.why,
    moduleCount: (t.trail_modules as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    userCount: usersByTrail.get(t.id) ?? 0,
  }));
}

export interface TrailOverview {
  trail: {
    id: string;
    title: string;
    trailType: string;
    intention: string | null;
    why: string | null;
  };
  modules: { id: string; title: string; internalName: string; topicCount: number }[];
  users: { id: string; name: string; role: string; studentType: string | null }[];
}

/**
 * Retrato completo da formação para leitura — alimenta o dialog de informações
 * aberto da listagem.
 *
 * Difere de `getTrailDetail` em dois pontos: traz quem usa a formação e a
 * contagem de tópicos de cada módulo, e dispensa `allModules` — aquela lista
 * existe só para o select que adiciona módulos na tela da formação.
 */
export async function getTrailOverview(trailId: string): Promise<TrailOverview | null> {
  const supabase = await readClient();

  const { data: trail } = await supabase
    .from("trails")
    .select("id, title, trail_type, intention, why")
    .eq("id", trailId)
    .single();

  if (!trail) return null;

  const [{ data: trailModules }, { data: users }] = await Promise.all([
    supabase
      .from("trail_modules")
      .select("order_index, modules(id, title, internal_name)")
      .eq("trail_id", trailId)
      // Ordem editorial da formação, não alfabética — ver CLAUDE.md.
      .order("order_index"),
    supabase
      .from("profiles")
      .select("id, full_name, role, student_type")
      .eq("trail_id", trailId)
      .order("full_name"),
  ]);

  const modules = (trailModules ?? []).flatMap((tm) => {
    const mod = tm.modules as { id: string; title: string; internal_name: string } | null;
    return mod ? [mod] : [];
  });

  // Contagem de tópicos numa consulta própria: agregado aninhado em dois níveis
  // (`modules(topics(count))`) não é confiável no PostgREST.
  const { data: topics } = modules.length
    ? await supabase
        .from("topics")
        .select("module_id")
        .in(
          "module_id",
          modules.map((m) => m.id)
        )
    : { data: [] as { module_id: string }[] };

  const topicsByModule = new Map<string, number>();
  for (const topic of topics ?? []) {
    topicsByModule.set(topic.module_id, (topicsByModule.get(topic.module_id) ?? 0) + 1);
  }

  return {
    trail: {
      id: trail.id,
      title: trail.title,
      trailType: trail.trail_type,
      intention: trail.intention,
      why: trail.why,
    },
    modules: modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      internalName: mod.internal_name,
      topicCount: topicsByModule.get(mod.id) ?? 0,
    })),
    users: (users ?? []).map((u) => ({
      id: u.id,
      name: u.full_name,
      role: u.role,
      studentType: u.student_type,
    })),
  };
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

export interface AdminModuleRow {
  id: string;
  title: string;
  internalName: string;
  intention: string | null;
  why: string | null;
  topicCount: number;
  /** Formações que incluem este módulo — vazio significa que ninguém o vê. */
  trailTitles: string[];
}

export async function listModules(): Promise<AdminModuleRow[]> {
  const supabase = await readClient();

  const { data } = await supabase
    .from("modules")
    .select(
      "id, title, internal_name, intention, why, topics(count), trail_modules(trails(title))"
    )
    .order("title");

  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    internalName: m.internal_name,
    intention: m.intention,
    why: m.why,
    topicCount: (m.topics as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    trailTitles: ((m.trail_modules as { trails: { title: string } | null }[] | null) ?? [])
      .map((tm) => tm.trails?.title)
      .filter((t): t is string => Boolean(t)),
  }));
}

export interface ModuleOverview {
  module: {
    id: string;
    title: string;
    internalName: string;
    intention: string | null;
    why: string | null;
  };
  topics: {
    id: string;
    title: string;
    learningObjective: string | null;
    hasRepertoire: boolean;
    hasExercise: boolean;
  }[];
  trails: { id: string; title: string; trailType: string }[];
}

/**
 * Retrato completo do módulo para leitura — alimenta o dialog de informações
 * aberto da listagem.
 *
 * Difere de `getModuleDetail` por trazer as formações que usam o módulo (a
 * tela de edição não precisa) e por dispensar `orderIndex`, que só serve aos
 * botões de reordenar.
 */
export async function getModuleOverview(moduleId: string): Promise<ModuleOverview | null> {
  const supabase = await readClient();

  const { data: mod } = await supabase
    .from("modules")
    .select("id, title, internal_name, intention, why")
    .eq("id", moduleId)
    .single();

  if (!mod) return null;

  const [{ data: topics }, { data: trailLinks }] = await Promise.all([
    supabase
      .from("topics")
      .select(
        "id, title, learning_objective, repertoire_items(count), exercises(count)"
      )
      .eq("module_id", moduleId)
      // Ordem editorial do módulo, não alfabética — ver CLAUDE.md.
      .order("order_index"),
    supabase
      .from("trail_modules")
      .select("trails(id, title, trail_type)")
      .eq("module_id", moduleId),
  ]);

  return {
    module: {
      id: mod.id,
      title: mod.title,
      internalName: mod.internal_name,
      intention: mod.intention,
      why: mod.why,
    },
    topics: (topics ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      learningObjective: t.learning_objective,
      hasRepertoire:
        ((t.repertoire_items as unknown as { count: number }[] | null)?.[0]?.count ?? 0) > 0,
      hasExercise:
        ((t.exercises as unknown as { count: number }[] | null)?.[0]?.count ?? 0) > 0,
    })),
    trails: (trailLinks ?? []).flatMap((tm) => {
      const trail = tm.trails as { id: string; title: string; trail_type: string } | null;
      if (!trail) return [];
      return [{ id: trail.id, title: trail.title, trailType: trail.trail_type }];
    }),
  };
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
