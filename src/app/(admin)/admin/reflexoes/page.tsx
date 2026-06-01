import { createClient } from "@/lib/supabase/server";
import { deleteReflection } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReflectionForm } from "./reflection-form";
import Link from "next/link";

export default async function ReflexoesAdminPage() {
  const supabase = await createClient();
  const [reflectionsResult, questionsResult, competenciesResult] = await Promise.all([
    supabase.from("reflections").select("*, competencies(title)").order("created_at", { ascending: false }),
    supabase.from("reflection_questions").select("*").order("order_index"),
    supabase.from("competencies").select("id, title, modules(title)").order("order_index"),
  ]);

  const reflections = reflectionsResult.data ?? [];
  const questions = questionsResult.data ?? [];
  const competencies = competenciesResult.data ?? [];

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Reflexões</h1>

      {reflections.length > 0 && (
        <div className="space-y-3">
          {reflections.map((r) => {
            const comp = r.competencies as { title: string } | null;
            const rQuestions = questions.filter((q) => q.reflection_id === r.id);
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{comp?.title ?? "—"}</p>
                  </div>
                  <DeleteButton action={deleteReflection.bind(null, r.id)} />
                </div>
                {rQuestions.length > 0 && (
                  <ul className="space-y-1 pl-3 border-l border-border/50">
                    {rQuestions.map((q) => (
                      <li key={q.id} className="text-xs text-muted-foreground">{q.question_text}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nova reflexão</h2>
        {competencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie uma competência primeiro.</p>
        ) : (
          <ReflectionForm competencies={competencies} />
        )}
      </section>
    </div>
  );
}
