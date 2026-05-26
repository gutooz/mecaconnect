import { BarChart3, Users, Car, ClipboardList, Wallet, Package, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function RelatoriosPage() {
  const { organization } = await getSessionData();
  const supabase = await createClient();
  const orgId = organization.id;

  const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    { count: customerCount },
    { count: vehicleCount },
    { count: osCount },
    { count: deliveredCount },
    { data: monthIncomes = [] },
    { data: items = [] },
    { count: partsCount },
  ] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("service_orders").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("service_orders").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).eq("status", "delivered").gte("delivered_at", startMonth),
    supabase.from("financial_transactions").select("amount, type, payment_status")
      .eq("organization_id", orgId).gte("created_at", startMonth),
    supabase.from("service_order_items").select("description, total, item_type, service_orders!inner(organization_id, delivered_at)")
      .eq("service_orders.organization_id", orgId).gte("service_orders.delivered_at", startMonth).limit(500),
    supabase.from("parts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("active", true),
  ]);

  const income = (monthIncomes ?? []).filter((t: any) => t.type === "income" && t.payment_status === "paid")
    .reduce((s, t: any) => s + Number(t.amount), 0);
  const expense = (monthIncomes ?? []).filter((t: any) => t.type === "expense" && t.payment_status === "paid")
    .reduce((s, t: any) => s + Number(t.amount), 0);
  const profit = income - expense;
  const ticketMedio = deliveredCount ? income / deliveredCount : 0;

  const ranking = new Map<string, number>();
  (items ?? []).forEach((it: any) => {
    if (it.item_type === "service") {
      ranking.set(it.description, (ranking.get(it.description) ?? 0) + Number(it.total));
    }
  });
  const topServices = Array.from(ranking.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da sua oficina · Mês atual</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Wallet />} label="Faturamento" value={formatCurrency(income)} accent="emerald" />
        <Stat icon={<TrendingUp />} label="Lucro" value={formatCurrency(profit)} accent="blue" />
        <Stat icon={<ClipboardList />} label="OS entregues" value={String(deliveredCount ?? 0)} accent="violet" />
        <Stat icon={<BarChart3 />} label="Ticket médio" value={formatCurrency(ticketMedio)} accent="amber" />
      </div>

      <div className="grid lg:grid-cols-4 gap-3">
        <Stat icon={<Users />} label="Clientes" value={String(customerCount ?? 0)} small />
        <Stat icon={<Car />} label="Veículos" value={String(vehicleCount ?? 0)} small />
        <Stat icon={<ClipboardList />} label="Total OS" value={String(osCount ?? 0)} small />
        <Stat icon={<Package />} label="Peças no estoque" value={String(partsCount ?? 0)} small />
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Ranking de serviços do mês</h3>
        {topServices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sem dados ainda</p>
        ) : (
          <ul className="space-y-3">
            {topServices.map(([name, total], i) => (
              <li key={name} className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold grid place-items-center">
                  #{i + 1}
                </div>
                <p className="flex-1 text-sm font-medium truncate">{name}</p>
                <p className="font-semibold whitespace-nowrap">{formatCurrency(total)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, accent = "blue", small }: {
  icon: React.ReactNode; label: string; value: string;
  accent?: "emerald" | "blue" | "amber" | "violet"; small?: boolean;
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
  } as const;
  return (
    <Card className={small ? "p-4" : "p-5"}>
      <div className={`size-10 rounded-xl grid place-items-center ${colors[accent]} ${small ? "" : "mb-3"}`}>{icon}</div>
      <p className={`text-xs text-muted-foreground ${small ? "mt-2" : ""}`}>{label}</p>
      <p className={`font-bold ${small ? "text-xl" : "text-2xl"} mt-1`}>{value}</p>
    </Card>
  );
}
