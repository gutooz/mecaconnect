import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  ClipboardList,
  Car,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceOrderStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { ServiceOrderStatus } from "@/types/database";
import { DashboardChart } from "./_components/chart";

export default async function DashboardPage() {
  const { profile, organization } = await getSessionData();
  const supabase = await createClient();
  const orgId = organization.id;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString();

  const [
    { count: inProgressCount },
    { count: openCount },
    { count: completedTodayCount },
    todayRevenue,
    monthRevenue,
    last7Revenue,
    recentOS,
    topServices,
    lowStock,
  ] = await Promise.all([
    supabase.from("service_orders").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).eq("status", "in_progress"),
    supabase.from("service_orders").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).not("status", "in", "(delivered,canceled)"),
    supabase.from("service_orders").select("id", { count: "exact", head: true })
      .eq("organization_id", orgId).eq("status", "delivered")
      .gte("delivered_at", startOfDay),
    supabase.from("financial_transactions").select("amount").eq("organization_id", orgId)
      .eq("type", "income").eq("payment_status", "paid").gte("paid_at", startOfDay),
    supabase.from("financial_transactions").select("amount").eq("organization_id", orgId)
      .eq("type", "income").eq("payment_status", "paid").gte("paid_at", startOfMonth),
    supabase.from("financial_transactions").select("amount, paid_at").eq("organization_id", orgId)
      .eq("type", "income").eq("payment_status", "paid").gte("paid_at", startOf7Days),
    supabase.from("service_orders").select("id, number, status, total, created_at, customer:customers(full_name), vehicle:vehicles(brand, model, plate)")
      .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5),
    supabase.from("service_order_items").select("description, item_type, quantity, total, service_orders!inner(organization_id)")
      .eq("service_orders.organization_id", orgId).eq("item_type", "service").limit(20),
    supabase.from("parts").select("id, name, stock_quantity, min_stock")
      .eq("organization_id", orgId).eq("active", true).limit(5),
  ]);

  const todayTotal = (todayRevenue.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
  const monthTotal = (monthRevenue.data ?? []).reduce((s, t) => s + Number(t.amount), 0);

  // Agrupa top serviços
  const serviceMap = new Map<string, { count: number; total: number }>();
  (topServices.data ?? []).forEach((row) => {
    const k = row.description;
    const cur = serviceMap.get(k) ?? { count: 0, total: 0 };
    cur.count += Number(row.quantity);
    cur.total += Number(row.total);
    serviceMap.set(k, cur);
  });
  const topServicesList = Array.from(serviceMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const lowStockList = (lowStock.data ?? []).filter(
    (p: any) => p.stock_quantity <= p.min_stock,
  );

  // Faturamento real dos últimos 7 dias, agrupado por dia
  const revenueByDay = new Map<string, number>();
  (last7Revenue.data ?? []).forEach((t) => {
    if (!t.paid_at) return;
    const key = new Date(t.paid_at).toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(t.amount));
  });
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      day: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      Faturamento: revenueByDay.get(key) ?? 0,
    };
  });
  const hasRevenue = last7.some((d) => d.Faturamento > 0);

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting}, {profile.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aqui está o resumo da {organization.name} hoje.
          </p>
        </div>
        <Link href="/os/nova">
          <Button variant="gradient" size="lg">
            <Plus /> Nova OS
          </Button>
        </Link>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={<Wallet className="size-5" />}
          label="Faturamento hoje"
          value={formatCurrency(todayTotal)}
          accent="emerald"
          delta={`${formatCurrency(monthTotal)} este mês`}
        />
        <KpiCard
          icon={<Car className="size-5" />}
          label="Em serviço"
          value={String(inProgressCount ?? 0)}
          accent="orange"
          delta="Veículos na oficina"
        />
        <KpiCard
          icon={<ClipboardList className="size-5" />}
          label="OS abertas"
          value={String(openCount ?? 0)}
          accent="blue"
          delta="Em andamento"
        />
        <KpiCard
          icon={<CheckCircle2 className="size-5" />}
          label="Entregues hoje"
          value={String(completedTodayCount ?? 0)}
          accent="violet"
          delta="Finalizadas"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Faturamento</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <Link href="/relatorios" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver relatórios <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {hasRevenue ? (
            <DashboardChart data={last7} />
          ) : (
            <div className="h-[240px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Sem faturamento registrado nos últimos 7 dias.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Serviços mais vendidos</h3>
            <TrendingUp className="size-4 text-muted-foreground" />
          </div>
          {topServicesList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem dados ainda</p>
          ) : (
            <ul className="space-y-3">
              {topServicesList.map(([name, data], i) => (
                <li key={name} className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold grid place-items-center">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{data.count}× · {formatCurrency(data.total)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">OS recentes</h3>
            <Link href="/os" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {(recentOS.data ?? []).length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="Nenhuma OS ainda"
              description="Crie sua primeira ordem de serviço."
              action={
                <Link href="/os/nova">
                  <Button variant="gradient"><Plus /> Criar OS</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y">
              {(recentOS.data ?? []).map((os: any) => (
                <li key={os.id}>
                  <Link
                    href={`/os/${os.id}`}
                    className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="size-10 rounded-lg bg-muted grid place-items-center font-mono text-xs font-bold shrink-0">
                      #{String(os.number).padStart(4, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{os.customer?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {os.vehicle?.brand} {os.vehicle?.model} · {os.vehicle?.plate}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <ServiceOrderStatusBadge status={os.status} />
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(os.created_at)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Alertas</h3>
            <AlertTriangle className="size-4 text-warning" />
          </div>
          {lowStockList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Tudo em ordem ✨</p>
          ) : (
            <ul className="space-y-2.5">
              {lowStockList.map((p: any) => (
                <li key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-warning/5 border border-warning/20">
                  <div className="size-9 rounded-lg bg-warning/10 text-warning grid place-items-center">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Restam {p.stock_quantity} · min. {p.min_stock}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  delta,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  accent: "emerald" | "blue" | "orange" | "violet";
}) {
  const accentMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  } as const;
  return (
    <Card className="p-4 lg:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`size-10 rounded-xl grid place-items-center ${accentMap[accent]}`}>{icon}</div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl lg:text-2xl font-bold tracking-tight mt-1">{value}</p>
      {delta && <p className="text-[11px] text-muted-foreground mt-1">{delta}</p>}
    </Card>
  );
}
