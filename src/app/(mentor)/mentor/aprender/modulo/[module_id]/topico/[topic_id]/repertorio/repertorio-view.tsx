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
      onAdvance={() => router.push(nextHref)}
    />
  );
}
