import "server-only";

import { updateTag } from "next/cache";
import { trailContentTag } from "@/lib/student/access";

/**
 * O conteúdo pedagógico é servido de `unstable_cache` com TTL de 60s em quatro
 * tags distintas. Sem invalidar, uma edição do admin demora até um minuto para
 * aparecer para aluno e mentor — tempo suficiente para o autor achar que a
 * gravação falhou e salvar de novo.
 *
 * - `trail-content:${trailId}` → src/lib/student/access.ts (trilha do aluno)
 * - `reference-trail:${type}`  → src/lib/mentor/reference-trail.ts (trilhas de referência)
 * - `topic:${topicId}`         → meta, repertório e exercício de um tópico (mentor)
 * - `trail-id-by-type`         → mapeamento tipo → id
 *
 * Usamos `updateTag` e não `revalidateTag(tag, "max")`: o segundo serve o
 * conteúdo velho enquanto revalida em segundo plano, então o autor que acabou
 * de salvar e foi conferir na tela do aluno veria a versão anterior. `updateTag`
 * expira na hora — é o caso de read-your-own-writes. Ele só funciona dentro de
 * Server Actions, que é de onde todas estas funções são chamadas.
 */

export function revalidateTrailContent(trailId: string) {
  updateTag(trailContentTag(trailId));
}

export function revalidateTopicContent(topicId: string) {
  updateTag(`topic:${topicId}`);
}

/**
 * Estrutura de módulos/tópicos mudou: as trilhas de referência do mentor são
 * montadas por `trail_type`, então não dá para saber por id qual foi afetada.
 * Invalidar as duas é barato e evita conteúdo velho na área do mentor.
 */
export function revalidateReferenceTrails() {
  updateTag("reference-trail:successor");
  updateTag("reference-trail:succeeded");
  updateTag("trail-id-by-type");
}
