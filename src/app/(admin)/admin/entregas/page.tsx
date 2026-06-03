import { createClient } from "@/lib/supabase/server";
import { createDeliverable, updateDeliverable, deleteDeliverable } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import Link from "next/link";

export default async function EntregasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const [deliverablesResult, competenciesResult] = await Promise.all([
    supabase.from("deliverables").select("*, competencies(title)").order("created_at", { ascending: false }),
    supabase.from("competencies").select("id, title, modules(title)").order("order_index"),
  ]);

  const deliverables = deliverablesResult.data ?? [];
  const competencies = competenciesResult.data ?? [];

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>

      {deliverables.length > 0 && (
        <div className="space-y-2">
          {deliverables.map((d) => {
            const comp = d.competencies as { title: string } | null;
            const isEditing = edit === d.id;
            return (
              <div key={d.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{comp?.title ?? "—"}</p>
                    {d.instructions_html && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{d.instructions_html.replace(/<[^>]+>/g, " ").slice(0, 80)}…</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={isEditing ? "/admin/entregas" : `?edit=${d.id}`}>
                      <Button variant="outline" size="sm">{isEditing ? "Cancelar" : "Editar"}</Button>
                    </Link>
                    <DeleteButton action={deleteDeliverable.bind(null, d.id)} />
                  </div>
                </div>
                {isEditing && (
                  <form action={updateDeliverable.bind(null, d.id)} className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label>Competência</Label>
                      <select name="competency_id" required defaultValue={d.competency_id} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        {competencies.map((c) => {
                          const mod = c.modules as { title: string } | null;
                          return <option key={c.id} value={c.id}>{c.title} — {mod?.title}</option>;
                        })}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Título</Label>
                      <Input name="title" required defaultValue={d.title} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Instruções</Label>
                      <textarea
                        name="instructions_html"
                        rows={5}
                        defaultValue={d.instructions_html ?? ""}
                        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <Button type="submit" size="sm">Salvar</Button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nova entrega</h2>
        {competencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie uma competência primeiro.</p>
        ) : (
          <form action={createDeliverable} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Competência</Label>
              <select name="competency_id" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Selecionar</option>
                {competencies.map((c) => {
                  const mod = c.modules as { title: string } | null;
                  return <option key={c.id} value={c.id}>{c.title} — {mod?.title}</option>;
                })}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input name="title" required placeholder="Mapa dos Três Círculos" />
            </div>
            <div className="space-y-1.5">
              <Label>Instruções</Label>
              <textarea
                name="instructions_html"
                rows={5}
                placeholder="O que o mentorado deve fazer..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="sm">Criar entrega</Button>
          </form>
        )}
      </section>
    </div>
  );
}
