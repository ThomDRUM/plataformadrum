import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { MentorSidebar } from "@/components/layout/mentor-sidebar";
import { MentorHeader } from "@/components/layout/mentor-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "mentor") redirect("/login");

  const supabase = await createClient();
  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("projects(name, families(name))")
    .eq("mentor_id", profile.id)
    .single();

  const project = mp?.projects as { name: string; families: { name: string } | null } | null;
  const familyName = project?.families?.name ?? "Projeto";

  return (
    <SidebarProvider>
      <MentorSidebar userName={profile.fullName} familyName={familyName} />
      <SidebarInset>
        <MentorHeader />
        <div className="px-10 py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
