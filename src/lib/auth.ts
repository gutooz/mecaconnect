import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/types/database";

export async function getSessionData(): Promise<{
  user: { id: string; email: string };
  profile: Profile;
  organization: Organization;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.organization_id) redirect("/onboarding");

  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single<Organization>();

  if (!organization) redirect("/onboarding");

  return {
    user: { id: user.id, email: user.email! },
    profile,
    organization,
  };
}
