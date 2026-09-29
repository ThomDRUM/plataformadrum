/**
 * Retorno padrão das Server Actions do admin.
 *
 * As actions do mentor são `void` e confiam no otimismo da UI, mas aqui os
 * formulários precisam mostrar o erro que veio do servidor (e-mail duplicado,
 * chave de service role ausente) em vez de falhar em silêncio.
 */
export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };

export const ROLE_LABEL: Record<string, string> = {
  student: "Mentorado",
  mentor: "Mentor",
  admin: "Admin",
};

export const STUDENT_TYPE_LABEL: Record<string, string> = {
  successor: "Sucessor",
  succeeded: "Sucedido",
};

/** `trails.trail_type` — qual público a formação atende. */
export const TRAIL_TYPE_LABEL: Record<string, string> = {
  successor: "Sucessor",
  succeeded: "Sucedido",
  mentor: "Mentor",
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

/** `project_schedule.status` — mesmos valores usados em `cronograma-client.tsx`. */
export const SCHEDULE_STATUS_LABEL: Record<string, string> = {
  a_comecar: "A começar",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};
