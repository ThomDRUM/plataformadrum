import { createClient } from "@/lib/supabase/server";
import { createModule, updateModule, deleteModule } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import Link from "next/link";

export default async function ModulosPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
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
            const isEditing = edit === mod.id;
            return (
              <div key={mod.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground tabular-nums w-5">{mod.order_index}</span>
                      <p className="text-sm font-medium">{mod.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{trail?.name ?? "—"}</p>
                    {mod.short_context && <p className="text-xs text-muted-foreground truncate">{mod.short_context}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={isEditing ? "/admin/modulos" : `?edit=${mod.id}`}>
                      <Button variant="outline" size="sm">{isEditing ? "Cancelar" : "Editar"}</Button>
                    </Link>
                    <DeleteButton action={deleteModule.bind(null, mod.id)} />
                  </div>
                </div>
                {isEditing && (
                  <form action={updateModule.bind(null, mod.id)} className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label>Trilha</Label>
                      <select name="trail_id" required defaultValue={mod.trail_id} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        {trails.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Título</Label>
                      <Input name="title" required defaultValue={mod.title} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contexto breve</Label>
                      <Textarea name="short_context" rows={2} defaultValue={mod.short_context ?? ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ordem</Label>
                      <Input name="order_index" type="number" defaultValue={mod.order_index} className="w-24" />
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
              <Input name="title" required placeholder="A Empresa Familiar e Seu Sistema" />
            </div>
            <div className="space-y-1.5">
              <Label>Contexto breve</Label>
              <Textarea name="short_context" rows={2} placeholder="O que acontece neste módulo..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input name="order_index" type="number" defaultValue={1} className="w-24" />
            </div>
            <Button type="submit" size="sm">Criar módulo</Button>
          </form>
        )}
      </section>
    </div>
  );
}
