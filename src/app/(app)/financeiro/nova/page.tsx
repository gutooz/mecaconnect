import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { NovaTransacaoForm } from "./_components/nova-transacao-form";

export default async function NovaTransacaoPage() {
  await getSessionData();
  const supabase = await createClient();

  // Busca todas as categorias (income + expense) de uma vez.
  // O componente cliente filtra localmente ao trocar o tipo.
  const { data: categories } = await supabase
    .from("financial_categories")
    .select("id, name, type")
    .order("name");

  return (
    <Suspense>
      <NovaTransacaoForm categories={categories ?? []} />
    </Suspense>
  );
}
