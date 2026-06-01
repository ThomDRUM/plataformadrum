import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/layout/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // If non-admin navigates here, send to /login — not to /momento (avoids loops)
  if (profile?.role !== "admin") redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNav />
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-10 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
