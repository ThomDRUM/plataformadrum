import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { StudentHeader } from "@/components/layout/student-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSessionProfile();

  if (!profile || profile.role !== "student") redirect("/login");

  return (
    <SidebarProvider>
      <StudentSidebar userName={profile.fullName} />
      <SidebarInset>
        <StudentHeader />
        <div className="px-10 py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
