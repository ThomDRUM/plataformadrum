import { createClient } from "@/lib/supabase/server";
import { createModule, deleteModule } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function ModulosPage() {
  const supabase = await createClient();
  const [modulesResult, trailsResult] = await Promise.all([
    supabase.from("modules").select("*, trails(name)").order("order_index"),
    supabase.from("trails").select("id, name").order("name"),
  ]);

  const modules = modulesResult.data ?? [];
  const trails = trailsResult.data ?? [];

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Módulos</h1>

      {modules.length > 0 && (
        <div className="space-y-2">
          {modules.map((mod) => {
            const trail = mod.trails as { name: string } | null;
            return (
              <div key={mod.id} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground tabular-nums w-5">{mod.order_index}</span>
                    <p className="text-sm font-medium">{mod.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{trail?.name ?? "—"}</p>
                  {mod.short_context && <p className="text-xs text-muted-foreground truncate">{mod.short_context}</p>}
                </div>
                <DeleteButton action={deleteModule.bind(null, mod.id)} />
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Novo módulo</h2>
        {trails.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie uma trilha primeiro.</p>
        ) : (
          <form action={createModule} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Trilha</Label>
              <select name="trail_id" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Selecionar trilha</option>
                {trails.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input name="title" required placeholder="00 · Kick-off" />
            </div>
            <div className="space-y-1.5">
              <Label>Contexto breve</Label>
              <Textarea name="short_context" rows={2} placeholder="O que acontece neste módulo..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input name="order_index" type="number" defaultValue={0} className="w-24" />
            </div>
            <Button type="submit" size="sm">Criar módulo</Button>
          </form>
        )}
      </section>
    </div>
  );
}
