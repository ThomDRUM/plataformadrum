import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentAccessData } from "@/lib/student/access";
import { TrailTabs } from "./_components/trail-tabs";
import { TrailModuleSelector } from "./_components/trail-module-selector";

export default async function MentorAprenderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { trail, modules } = await getStudentAccessData(supabase, user.id, "mentor");

  return (
    <div className="max-w-2xl">
      <TrailTabs />
      <TrailModuleSelector
        modules={modules}
        currentModuleId={null}
        baseHref="/mentor/aprender/modulo"
        overviewHref="/mentor/aprender"
      />

      {trail ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-snug">
            {trail.title}
          </h1>
          {trail.intention && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Intenção
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{trail.intention}</p>
            </div>
          )}
          {trail.why && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Por quê?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{trail.why}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
        </div>
      )}
    </div>
  );
}
