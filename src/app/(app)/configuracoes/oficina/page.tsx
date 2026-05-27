import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { OficinaForm } from "./_components/oficina-form";

export default async function OficinaConfigPage() {
  // getSessionData já garante auth e retorna a organização do usuário
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, cnpj, phone, email, address")
    .eq("id", organization.id)
    .single();

  if (!org) return <div className="container py-10">Organização não encontrada.</div>;

  return <OficinaForm org={org} />;
}
