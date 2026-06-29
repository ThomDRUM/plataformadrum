import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Plus, ChevronRight } from "lucide-react";

export default async function FamiliasPage() {
  const supabase = await createClient();

  const { data: families } = await supabase
    .from("families")
    .select("id, name, business_name, created_at")
    .order("name");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Famílias</h1>
        <LinkButton href="/admin/familias/nova" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Nova família
        </LinkButton>
      </div>

      {!families || families.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">Nenhuma família ainda.</p>
          <LinkButton href="/admin/familias/nova" size="sm" variant="outline">
            Criar primeira família
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-2">
          {families.map((family) => (
            <Link
              key={family.id}
              href={`/admin/familias/${family.id}`}
              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-primary/25 hover:bg-accent/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {family.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{family.name}</p>
                {family.business_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{family.business_name}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
