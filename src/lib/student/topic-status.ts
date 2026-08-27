/**
 * Estado de um tópico na trilha do aluno.
 *
 * `completed_partial` é um exercício enviado com pelo menos uma resposta em
 * branco: conta como concluído para efeito de progresso e desbloqueio, mas a
 * UI o sinaliza em amarelo em vez do check verde.
 */
export type TopicStatus = "not_started" | "repertoire_viewed" | "completed" | "completed_partial";

/** O aluno já percorreu o tópico inteiro — com ou sem respostas em branco. */
export function isTopicDone(status: TopicStatus): boolean {
  return status === "completed" || status === "completed_partial";
}
