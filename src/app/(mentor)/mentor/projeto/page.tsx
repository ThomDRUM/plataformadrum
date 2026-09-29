import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { getProjetoOverview } from "@/lib/mentor/projeto";
import { ProjetoClient } from "./_components/projeto-client";

export default async function ProjetoPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const data = await getProjetoOverview(user.id);
  if (!data) redirect("/login");

  return <ProjetoClient {...data} />;
}
