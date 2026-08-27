import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { getReunioesOverview } from "@/lib/mentor/reunioes";
import { MapaAlinhamentos } from "./_components/mapa-alinhamentos";
import { ReunioesSection } from "./_components/reunioes-section";

export default async function AlinhamentosPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const data = await getReunioesOverview(user.id);
  if (!data) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">
          {data.familyName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Alinhamentos</h1>
      </div>

      <MapaAlinhamentos />

      <ReunioesSection projectId={data.projectId} meetings={data.meetings} />
    </div>
  );
}
