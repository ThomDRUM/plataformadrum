import { notFound } from "next/navigation";
import { getTopicDetail, getModuleDetail } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/page-header";
import { TopicContentBadges } from "@/components/admin/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={topic.title}
        description={moduleDetail.module.title}
        backHref={`/admin/modulos/${moduleId}`}
        backLabel={moduleDetail.module.title}
      />

      <div className="-mt-4 mb-6">
        <TopicContentBadges
          hasRepertoire={repertoire !== null}
          questionCount={exercise ? questions.length : null}
        />
      </div>

      {/* Todas as abas ficam montadas (`keepMounted`): trocar de aba não pode
          descartar um repertório editado e ainda não salvo. */}
      <Tabs defaultValue="repertorio">
        <TabsList>
          <TabsTrigger value="repertorio">Repertório</TabsTrigger>
          <TabsTrigger value="exercicio">
            Exercício
            {exercise && questions.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {questions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="topico">Dados do tópico</TabsTrigger>
        </TabsList>

        <TabsContent value="repertorio" keepMounted className="pt-6">
          <RepertorioEditor topicId={topic_id} moduleId={moduleId} repertoire={repertoire} />
        </TabsContent>

        <TabsContent value="exercicio" keepMounted className="pt-6">
          <ExercicioEditor
            topicId={topic_id}
            moduleId={moduleId}
            exercise={exercise}
            questions={questions}
          />
        </TabsContent>

        <TabsContent value="topico" keepMounted className="pt-6">
          <TopicoForm topicId={topic_id} moduleId={moduleId} initial={topic} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
