import { getAuthUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/admin";
import { SettingsContent } from "@/components/settings/settings-content";

export default async function ConfiguracoesPage() {
  const profile = await requireAdmin();
  const user = await getAuthUser();

  return <SettingsContent fullName={profile.fullName} email={user?.email ?? null} />;
}
