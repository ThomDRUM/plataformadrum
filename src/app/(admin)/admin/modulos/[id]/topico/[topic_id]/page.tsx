import { notFound } from "next/navigation";
import { getTopicDetail, getModuleDetail } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/page-header";
import { Separator } from "@/components/ui/separator";
import { TopicoForm } from "./_components/topico-form";
import { RepertorioEditor } from "./_components/repertorio-editor";
import { ExercicioEditor } from "./_components/exercicio-editor";

export default async function TopicoPage({
  params,
}: {
  params: Promise<{ id: string; topic_id: string }>;
}) {
  const { id: moduleId, topic_id } = await params;

  const [detail, moduleDetail] = await Promise.all([
    getTopicDetail(topic_id),
    getModuleDetail(moduleId),
  ]);

  if (!detail || !moduleDetail) notFound();

  const { topic, repertoire, exercise, questions } = detail;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={topic.title}
        description={moduleDetail.module.title}
        backHref={`/admin/modulos/${moduleId}`}
        backLabel={moduleDetail.module.title}
      />

      <div className="space-y-10">
        <RepertorioEditor topicId={topic_id} moduleId={moduleId} repertoire={repertoire} />

        <Separator />

        <ExercicioEditor
          topicId={topic_id}
          moduleId={moduleId}
          exercise={exercise}
          questions={questions}
        />

        <Separator />

        <TopicoForm topicId={topic_id} moduleId={moduleId} initial={topic} />
      </div>
    </div>
  );
}
