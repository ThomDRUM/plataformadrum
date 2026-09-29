import { createClient } from "@/lib/supabase/server";

export interface FamilyMember {
  id: string;
  name: string;
  initials: string;
  generation: number;
  family_role: string;
  business_role: string;
  parent_id: string | null;
  works_in_business: boolean;
  notes: string;
  order_index: number;
  spouse_id: string | null;
  profile_url: string | null;
}

export interface FamilyData {
  id: string;
  name: string;
  history: string;
  mission: string;
  vision: string;
  values: string;
}

export interface GovernanceItem {
  id: string;
  domain: string;
  item_text: string;
  order_index: number;
  has_today: boolean | null;
  wants: boolean | null;
}

export interface FamilyAsset {
  id: string;
  name: string;
  asset_type: string;
  description: string | null;
  order_index: number;
}

export interface AssetOwnership {
  id: string;
  asset_id: string;
  family_member_id: string | null;
  member_name: string | null;
  percentage: number | null;
}

export interface Successor {
  id: string;
  full_name: string;
  termometro_pdf_url: string | null;
}

export interface FamiliaOverviewData {
  family: FamilyData;
  members: FamilyMember[];
  governanceItems: GovernanceItem[];
  assets: FamilyAsset[];
  ownership: AssetOwnership[];
  successors: Successor[];
}

export async function getFamiliaOverview(mentorId: string): Promise<FamiliaOverviewData | null> {
  const supabase = await createClient();

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id, projects(family_id, families(id, name, history, mission, vision, values))")
    .eq("mentor_id", mentorId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!mp) return null;

  const project = mp.projects as {
    family_id: string;
    families: FamilyData | null;
  } | null;

  if (!project?.families) return null;

  const family = project.families;
  const projectId = mp.project_id;

  const [successorsRes, membersRes, governanceRes, assetsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, termometro_pdf_url")
      .eq("project_id", projectId)
      .eq("student_type", "successor")
      .order("full_name"),
    supabase
      .from("family_members")
      .select(
        "id, name, initials, generation, family_role, business_role, parent_id, works_in_business, notes, order_index, spouse_id, profile_url"
      )
      .eq("family_id", family.id)
      .order("order_index"),
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

  const assetIds = (assetsRes.data ?? []).map((a) => a.id);
  const { data: ownershipData } = assetIds.length
    ? await supabase
        .from("family_asset_ownership")
        .select("id, asset_id, family_member_id, member_name, percentage")
        .in("asset_id", assetIds)
    : { data: [] };

  return {
    family,
    members: (membersRes.data ?? []) as FamilyMember[],
    governanceItems: (governanceRes.data ?? []) as GovernanceItem[],
    assets: (assetsRes.data ?? []) as FamilyAsset[],
    ownership: (ownershipData ?? []) as AssetOwnership[],
    successors: (successorsRes.data ?? []) as Successor[],
  };
}
