import { createClient } from "@/lib/supabase/server";
import { createRepertoireItem, deleteRepertoireItem } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";

export default async function RepertorioAdminPage() {
  const supabase = await createClient();
  const [itemsResult, competenciesResult] = await Promise.all([
    supabase.from("repertoire_items").select("*, competencies(title)").order("created_at", { ascending: false }),
    supabase.from("competencies").select("id, title, module_id, modules(title)").order("order_index"),
  ]);

  const items = itemsResult.data ?? [];
  const competencies = competenciesResult.data ?? [];

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Repertório</h1>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const comp = item.competencies as { title: string } | null;
            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="outline" className="text-xs">{item.type === "external" ? "Link" : "Interno"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{comp?.title ?? "—"}</p>
                  {item.short_summary && <p className="text-xs text-muted-foreground truncate">{item.short_summary}</p>}
                </div>
                <DeleteButton action={deleteRepertoireItem.bind(null, item.id)} />
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Novo item</h2>
        {competencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie uma competência primeiro.</p>
        ) : (
          <form action={createRepertoireItem} className="space-y-4">
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
              <Input name="title" required placeholder="Como navegar conflitos familiares" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição breve</Label>
              <Textarea name="description" rows={2} placeholder="Do que se trata..." />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <select name="type" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="external">Link externo</option>
                <option value="internal">Conteúdo interno</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>URL externa (se externo)</Label>
              <Input name="external_url" type="url" placeholder="https://..." />
            </div>
            <Button type="submit" size="sm">Criar item</Button>
          </form>
        )}
      </section>
    </div>
  );
}
