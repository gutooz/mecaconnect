import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { NovoOrcamentoForm } from "./_components/novo-orcamento-form";

export default async function NovoOrcamentoPage() {
  await getSessionData();
  const supabase = await createClient();

  const [customersRes, vehiclesRes] = await Promise.all([
    supabase.from("customers").select("id, full_name").order("full_name").limit(500),
    supabase.from("vehicles").select("id, brand, model, plate, customer_id").limit(500),
  ]);

  return (
    <Suspense>
      <NovoOrcamentoForm
        customers={customersRes.data ?? []}
        vehicles={vehiclesRes.data ?? []}
      />
    </Suspense>
  );
}
