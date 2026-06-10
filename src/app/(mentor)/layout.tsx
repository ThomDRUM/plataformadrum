import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MentorSidebar } from "@/components/layout/mentor-sidebar";

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Mock mode: any logged-in user can access for now
  // TODO: check role === "mentor" after back-end is built

  return (
    <div className="flex min-h-screen bg-background">
      <MentorSidebar userName="Thomas Freier" familyName="Família Rodrigues" />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
