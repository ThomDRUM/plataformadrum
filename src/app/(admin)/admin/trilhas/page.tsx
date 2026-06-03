import { createClient } from "@/lib/supabase/server";
import { createTrail, updateTrail, deleteTrail } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import Link from "next/link";

export default async function TrilhasPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const { data: trails } = await supabase.from("trails").select("*, modules(count)").order("name");
  const allTrails = trails ?? [];
  const editingTrail = edit ? allTrails.find((t) => t.id === edit) ?? null : null;

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Trilhas</h1>

      {allTrails.length > 0 && (
        <div className="space-y-2">
          {allTrails.map((trail) => {
            const moduleCount = (trail.modules as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
            const isEditing = edit === trail.id;
            return (
              <div key={trail.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{trail.name}</p>
                    {trail.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{trail.description}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{moduleCount} módulo{moduleCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={isEditing ? "/admin/trilhas" : `?edit=${trail.id}`}>
                      <Button variant="outline" size="sm">{isEditing ? "Cancelar" : "Editar"}</Button>
                    </Link>
                    <DeleteButton action={deleteTrail.bind(null, trail.id)} />
                  </div>
                </div>
                {isEditing && (
                  <form action={updateTrail.bind(null, trail.id)} className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label>Nome</Label>
                      <Input name="name" required defaultValue={trail.name} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Descrição</Label>
                      <Textarea name="description" rows={2} defaultValue={trail.description ?? ""} />
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
