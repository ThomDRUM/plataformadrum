"use client";

import { useRouter } from "next/navigation";
import { RepertoireBlock, type RepertoireItemData } from "@/components/topic/repertoire-block";

interface Props {
  userId: string;
  topicId: string;
  item: RepertoireItemData | null;
  hasExercise: boolean;
  nextHref: string;
}

export function RepertorioView({ userId, topicId, item, hasExercise, nextHref }: Props) {
  const router = useRouter();

  return (
    <RepertoireBlock
      userId={userId}
      topicId={topicId}
      item={item}
      viewed={false}
      hasExercise={hasExercise}
      onAdvance={() => {
        // O progresso acabou de ser gravado: invalida o Router Cache antes de
        // navegar, senão a próxima tela pode vir de uma cópia em cache (até 60s,
        // ver staleTimes no next.config.ts) e mostrar o status desatualizado.
        router.refresh();
        router.push(nextHref);
      }}
    />
  );
}
