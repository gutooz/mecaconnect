import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { NovaOSForm } from "./_components/nova-os-form";

// Toda a busca de dados acontece no servidor — o browser nunca
// vê chamadas diretas ao Supabase na aba Network.
export default async function NovaOSPage() {
  await getSessionData(); // garante autenticação
  const supabase = await createClient();

  const [customersRes, vehiclesRes, mechanicsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .order("full_name")
      .limit(500),
    supabase
      .from("vehicles")
      .select("id, brand, model, plate, customer_id")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["mechanic", "owner", "admin", "manager"])
      .order("full_name")
      .limit(100),
  ]);

  return (
    <Suspense>
      <NovaOSForm
        customers={customersRes.data ?? []}
        vehicles={vehiclesRes.data ?? []}
        mechanics={mechanicsRes.data ?? []}
      />
    </Suspense>
  );
}
