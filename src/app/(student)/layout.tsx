import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentHeader } from "@/components/layout/student-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, trail_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "student") redirect("/login");

  return (
    <SidebarProvider>
      <StudentSidebar userName={profile.full_name} />
      <SidebarInset>
        <StudentHeader />
        <div className="px-10 py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
