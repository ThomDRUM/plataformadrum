import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FamiliaClient } from "./_components/familia-client";

export default async function FamiliaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id, projects(family_id, families(id, name, history, mission, vision, values))")
    .eq("mentor_id", user.id)
    .single();

  if (!mp) redirect("/login");

  const project = mp.projects as {
    family_id: string;
    families: { id: string; name: string; history: string; mission: string; vision: string; values: string } | null;
  } | null;

  if (!project?.families) redirect("/login");

  const family = project.families;
  const projectId = mp.project_id;

  const { data: successors } = await supabase
    .from("profiles")
    .select("id, full_name, termometro_pdf_url")
    .eq("project_id", projectId)
    .eq("student_type", "successor")
    .order("full_name");

  const { data: members } = await supabase
    .from("family_members")
    .select("id, name, initials, generation, family_role, business_role, parent_id, works_in_business, notes, order_index, spouse_id, profile_url")
    .eq("family_id", family.id)
    .order("order_index");

  type Member = {
    id: string; name: string; initials: string; generation: number;
    family_role: string; business_role: string; parent_id: string | null;
    works_in_business: boolean; notes: string;
    order_index: number; spouse_id: string | null; profile_url: string | null;
  };

  const [governanceRes, assetsRes] = await Promise.all([
    supabase
      .from("family_governance_items")
      .select("id, domain, item_text, order_index, has_today, wants")
      .eq("family_id", family.id)
      .order("order_index"),
    supabase
      .from("family_assets")
      .select("id, name, asset_type, description, order_index")
      .eq("family_id", family.id)
      .order("order_index"),
  ]);

  type GovernanceItem = {
    id: string; domain: string; item_text: string;
    order_index: number; has_today: boolean | null; wants: boolean | null;
  };
  type Asset = {
    id: string; name: string; asset_type: string;
    description: string | null; order_index: number;
  };
  type Ownership = {
    id: string; asset_id: string;
    family_member_id: string | null; member_name: string | null;
    percentage: number | null;
  };

  const assetIds = (assetsRes.data ?? []).map((a) => a.id);
  const { data: ownershipData } = assetIds.length
    ? await supabase
        .from("family_asset_ownership")
        .select("id, asset_id, family_member_id, member_name, percentage")
        .in("asset_id", assetIds)
    : { data: [] };

  return (
    <FamiliaClient
      family={family}
      members={(members ?? []) as Member[]}
      governanceItems={(governanceRes.data ?? []) as GovernanceItem[]}
      assets={(assetsRes.data ?? []) as Asset[]}
      ownership={(ownershipData ?? []) as Ownership[]}
      successors={(successors ?? []) as { id: string; full_name: string; termometro_pdf_url: string | null }[]}
    />
  );
}
