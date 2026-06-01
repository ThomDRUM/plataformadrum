import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentSidebar } from "@/components/layout/student-sidebar";

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

  // If admin navigates here, send to /login — they'll be redirected to /admin by the proxy
  if (!profile || profile.role === "admin") redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <StudentSidebar userName={profile.full_name} />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
