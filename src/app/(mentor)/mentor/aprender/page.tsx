import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { getMentorTrailFullContent } from "@/lib/mentor/mentor-trail-content";
import { TrailTabs } from "./_components/trail-tabs";
import { TrailModuleNav } from "./_components/trail-module-nav";

export default async function MentorAprenderPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const data = await getMentorTrailFullContent(supabase, user.id);

  const navItems = data.trail
    ? [
        { id: null, href: "/mentor/aprender", label: "Visão Geral" },
        ...data.modules.map((m) => ({
          id: m.id,
          href: `/mentor/aprender/modulo/${m.id}`,
          label: `Módulo ${m.orderIndex} — ${m.title}`,
        })),
      ]
    : [];

  return (
    <div className="max-w-5xl">
      <TrailTabs />

      {!data.trail ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-10">
          <TrailModuleNav items={navItems} currentId={null} />

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-snug">
              {data.trail.title}
            </h1>
            {data.trail.intention && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                  Intenção
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">{data.trail.intention}</p>
              </div>
            )}
            {data.trail.why && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                  Por quê?
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.trail.why}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
