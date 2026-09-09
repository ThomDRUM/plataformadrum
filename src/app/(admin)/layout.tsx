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
        <div className="min-w-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
