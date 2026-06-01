import { createClient } from "@/lib/supabase/server";
import { createDeliverable, deleteDeliverable } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function EntregasAdminPage() {
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
            return (
              <div key={d.id} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{comp?.title ?? "—"}</p>
                </div>
                <DeleteButton action={deleteDeliverable.bind(null, d.id)} />
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
              <Input name="title" required placeholder="Prioridades de longo prazo" />
            </div>
            <div className="space-y-1.5">
              <Label>Instruções (HTML / texto)</Label>
              <textarea
                name="instructions_html"
                rows={4}
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
