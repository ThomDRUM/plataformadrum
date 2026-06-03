import { createClient } from "@/lib/supabase/server";
import { createCompetency, updateCompetency, deleteCompetency } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import Link from "next/link";

export default async function CompetenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
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
            const isEditing = edit === c.id;
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{mod?.title ?? "—"}</p>
                    {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={isEditing ? "/admin/competencias" : `?edit=${c.id}`}>
                      <Button variant="outline" size="sm">{isEditing ? "Cancelar" : "Editar"}</Button>
                    </Link>
                    <DeleteButton action={deleteCompetency.bind(null, c.id)} />
                  </div>
                </div>
                {isEditing && (
                  <form action={updateCompetency.bind(null, c.id)} className="space-y-3 pt-2 border-t border-border">
                    <div className="space-y-1.5">
                      <Label>Módulo</Label>
                      <select name="module_id" required defaultValue={c.module_id} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        {modules.map((m) => <option key={m.id} value={m.id}>{m.order_index} · {m.title}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Título</Label>
                      <Input name="title" required defaultValue={c.title} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Descrição</Label>
                      <Textarea name="description" rows={2} defaultValue={c.description ?? ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ordem</Label>
                      <Input name="order_index" type="number" defaultValue={c.order_index} className="w-24" />
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
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nova competência</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie um módulo primeiro.</p>
        ) : (
          <form action={createCompetency} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Módulo</Label>
              <select name="module_id" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Selecionar módulo</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.order_index} · {m.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input name="title" required placeholder="Ler sistemas familiares além das relações individuais" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea name="description" rows={2} placeholder="O que esta competência desenvolve..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input name="order_index" type="number" defaultValue={1} className="w-24" />
            </div>
            <Button type="submit" size="sm">Criar competência</Button>
          </form>
        )}
      </section>
    </div>
  );
}
