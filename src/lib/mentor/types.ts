/** Retorno padrão das Server Actions do mentor que precisam reportar erro à UI. */
export type ActionResult<T = void> =
  | ({ ok: true } & (T extends void ? object : { data: T }))
  | { ok: false; error: string };
