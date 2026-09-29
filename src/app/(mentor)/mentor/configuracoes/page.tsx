import { redirect } from "next/navigation";
import { getAuthUser, getSessionProfile } from "@/lib/auth/session";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function ConfiguracoesPage() {
  const [user, profile] = await Promise.all([getAuthUser(), getSessionProfile()]);
  if (!user || !profile) redirect("/login");

  return <SettingsContent fullName={profile.fullName} email={user.email ?? null} />;
}
