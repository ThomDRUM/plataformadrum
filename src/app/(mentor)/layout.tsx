import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MentorSidebar } from "@/components/layout/mentor-sidebar";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "mentor") redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("projects(name, families(name))")
    .eq("mentor_id", user.id)
    .single();

  const project = mp?.projects as { name: string; families: { name: string } | null } | null;
  const familyName = project?.families?.name ?? "Projeto";

  return (
    <div className="flex min-h-screen bg-background">
      <MentorSidebar userName={profile.full_name} familyName={familyName} />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
