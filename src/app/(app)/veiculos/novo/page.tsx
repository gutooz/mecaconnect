import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { NovoVeiculoForm } from "./_components/novo-veiculo-form";

export default async function NovoVeiculoPage() {
  await getSessionData(); // garante autenticação
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name")
    .order("full_name", { ascending: true })
    .limit(500);

  return (
    <Suspense>
      <NovoVeiculoForm customers={customers ?? []} />
    </Suspense>
  );
}
