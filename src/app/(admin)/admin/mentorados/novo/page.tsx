import { createClient } from "@/lib/supabase/server";
import { NovoMentoradoForm } from "./novo-mentorado-form";
import Link from "next/link";

export default async function NovoMentoradoPage() {
  const supabase = await createClient();
  const { data: trails } = await supabase.from("trails").select("id, name").order("name");

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">
          ← Mentorados
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Novo mentorado</h1>
      </div>

      <NovoMentoradoForm trails={trails ?? []} />
    </div>
  );
}
