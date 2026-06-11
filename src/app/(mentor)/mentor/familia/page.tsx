import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FamiliaClient } from "./_components/familia-client";

export default async function FamiliaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("projects(family_id, families(id, name, history, mission, vision, values))")
    .eq("mentor_id", user.id)
    .single();

  if (!mp) redirect("/login");

  const project = mp.projects as {
    family_id: string;
    families: { id: string; name: string; history: string; mission: string; vision: string; values: string } | null;
  } | null;

  if (!project?.families) redirect("/login");

  const family = project.families;

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, initials, generation, family_role, business_role, parent_id, works_in_business, notes")
    .eq("family_id", family.id)
    .order("generation")
    .order("name");

  type Member = {
    id: string; name: string; initials: string; generation: number;
    family_role: string; business_role: string; parent_id: string | null;
    works_in_business: boolean; notes: string;
  };

  return (
    <FamiliaClient
      family={family}
      members={(members ?? []) as Member[]}
    />
  );
}
