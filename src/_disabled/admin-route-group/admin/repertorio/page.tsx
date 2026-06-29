import { createClient } from "@/lib/supabase/server";
import { createRepertoireItem, updateRepertoireItem, deleteRepertoireItem } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import Link from "next/link";

const LEVEL_LABEL: Record<number, string> = { 1: "Básico", 2: "Aprofundamento", 3: "Complementar" };

export default async function RepertorioAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const [itemsResult, competenciesResult] = await Promise.all([
    supabase.from("repertoire_items").select("*, competencies(title)").order("created_at", { ascending: false }),
    supabase.from("competencies").select("id, title, module_id, modules(title)").order("order_index"),
  ]);

  const items = itemsResult.data ?? [];
  const competencies = competenciesResult.data ?? [];

  const RepertoireForm = ({ item }: { item?: typeof items[0] }) => (
    <form action={item ? updateRepertoireItem.bind(null, item.id) : createRepertoireItem} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Competência</Label>
        <select name="competency_id" required defaultValue={item?.competency_id ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          {!item && <option value="">Selecionar</option>}
          {competencies.map((c) => {
            const mod = c.modules as { title: string } | null;
            return <option key={c.id} value={c.id}>{c.title} — {mod?.title}</option>;
          })}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input name="title" required defaultValue={item?.title ?? ""} placeholder="Os Três Círculos: família, propriedade, negócio" />
      </div>
      <div className="space-y-1.5">
        <Label>Nível</Label>
        <select name="level" required defaultValue={item?.level ?? 1} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value={1}>1 — Básico</option>
          <option value={2}>2 — Aprofundamento</option>
          <option value={3}>3 — Complementar</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Tipo de material</Label>
        <Input name="material_type" defaultValue={item?.material_type ?? ""} placeholder="Livro, Artigo, Vídeo, Podcast..." />
      </div>
      <div className="space-y-1.5">
        <Label>Resumo breve</Label>
        <Input name="short_summary" defaultValue={item?.short_summary ?? ""} placeholder="Uma linha sobre do que se trata..." />
      </div>
      <div className="space-y-1.5">
        <Label>Resumo completo</Label>
        <Textarea name="full_summary" rows={3} defaultValue={item?.full_summary ?? ""} placeholder="Descrição expandida (aparece ao abrir o item)..." />
      </div>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <select name="type" required defaultValue={item?.type ?? "external"} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="external">Link externo</option>
          <option value="internal">Conteúdo interno</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>URL externa</Label>
        <Input name="external_url" type="url" defaultValue={item?.external_url ?? ""} placeholder="https://..." />
      </div>
      <Button type="submit" size="sm">{item ? "Salvar" : "Criar item"}</Button>
    </form>
  );

  return (
    <div className="space-y-10 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Repertório</h1>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const comp = item.competencies as { title: string } | null;
            const isEditing = edit === item.id;
            return (
              <div key={item.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge variant="outline" className="text-xs">{LEVEL_LABEL[item.level] ?? `Nível ${item.level}`}</Badge>
                      {item.material_type && <Badge variant="outline" className="text-xs">{item.material_type}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{comp?.title ?? "—"}</p>
                    {item.short_summary && <p className="text-xs text-muted-foreground truncate">{item.short_summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={isEditing ? "/admin/repertorio" : `?edit=${item.id}`}>
                      <Button variant="outline" size="sm">{isEditing ? "Cancelar" : "Editar"}</Button>
                    </Link>
                    <DeleteButton action={deleteRepertoireItem.bind(null, item.id)} />
                  </div>
                </div>
                {isEditing && (
                  <div className="pt-2 border-t border-border">
                    <RepertoireForm item={item} />
                  </div>
                )}
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
          <RepertoireForm />
        )}
      </section>
    </div>
  );
}
