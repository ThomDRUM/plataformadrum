import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { getFamiliaOverview } from "@/lib/mentor/familia";
import { FamiliaClient } from "./_components/familia-client";

export default async function FamiliaPage() {
  const mentor = await getSessionProfile();
  if (!mentor) redirect("/login");

  const data = await getFamiliaOverview(mentor.id);
  if (!data) redirect("/login");

  return <FamiliaClient {...data} />;
}
