import { requireAdmin, isOpenAccessEnabled } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";
import { OpenAccessBanner } from "@/components/admin/open-access-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <SidebarProvider>
      <AdminSidebar userName={profile.fullName} />
      <SidebarInset>
        {isOpenAccessEnabled() && <OpenAccessBanner />}
        <AdminHeader />
        <div className="px-10 py-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
