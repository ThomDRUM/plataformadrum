import { createClient } from "@/lib/supabase/server";
import { createCompetency, deleteCompetency } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function CompetenciasPage() {
  const supabase = await createClient();
  const [competenciesResult, modulesResult] = await Promise.all([
    supabase.from("competencies").select("*, modules(title)").order("order_index"),
    supabase.from("modules").select("id, title, order_index").order("order_index"),
  ]);

  const competencies = competenciesResult.data ?? [];
  const modules = modulesResult.data ?? [];

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Competências</h1>

      {competencies.length > 0 && (
        <div className="space-y-2">
          {competencies.map((c) => {
            const mod = c.modules as { title: string } | null;
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod?.title ?? "—"}</p>
                  {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                </div>
                <DeleteButton action={deleteCompetency.bind(null, c.id)} />
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nova competência</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie um módulo primeiro.</p>
        ) : (
          <form action={createCompetency} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Módulo</Label>
              <select name="module_id" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Selecionar módulo</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input name="title" required placeholder="Autoconhecimento" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea name="description" rows={2} placeholder="O que esta competência desenvolve..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input name="order_index" type="number" defaultValue={0} className="w-24" />
            </div>
            <Button type="submit" size="sm">Criar competência</Button>
          </form>
        )}
      </section>
    </div>
  );
}
