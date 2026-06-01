import { createClient } from "@/lib/supabase/server";
import { createTrail, updateTrail, deleteTrail } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function TrilhasPage() {
  const supabase = await createClient();
  const { data: trails } = await supabase.from("trails").select("*, modules(count)").order("name");

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Trilhas</h1>

      {/* List */}
      {(trails ?? []).length > 0 && (
        <div className="space-y-2">
          {(trails ?? []).map((trail) => {
            const moduleCount = (trail.modules as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
            return (
              <div key={trail.id} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{trail.name}</p>
                  {trail.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{trail.description}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{moduleCount} módulo{moduleCount !== 1 ? "s" : ""}</p>
                </div>
                <DeleteButton action={deleteTrail.bind(null, trail.id)} />
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      {/* Create form */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nova trilha</h2>
        <form action={createTrail} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input name="name" required placeholder="Sucessor — Conquistas no Mercado" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea name="description" rows={2} placeholder="Objetivo da trilha..." />
          </div>
          <Button type="submit" size="sm">Criar trilha</Button>
        </form>
      </section>
    </div>
  );
}
