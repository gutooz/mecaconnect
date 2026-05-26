import Link from "next/link";
import { Plus, ClipboardList, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ServiceOrderStatusBadge, OS_STATUS_LABEL } from "@/components/ui/status-badge";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import type { ServiceOrderStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: ServiceOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "received", label: "Recebido" },
  { value: "analyzing", label: "Em análise" },
  { value: "awaiting_approval", label: "Aprovação" },
  { value: "in_progress", label: "Em manutenção" },
  { value: "completed", label: "Finalizado" },
  { value: "delivered", label: "Entregue" },
];

export default async function OSPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { organization } = await getSessionData();
  const { status = "all", q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("service_orders")
    .select("id, number, status, total, created_at, customer:customers(full_name), vehicle:vehicles(brand, model, plate)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status as any);
  if (q) {
    query = query.or(`reported_problem.ilike.%${q}%,diagnosis.ilike.%${q}%`);
  }

  const { data: orders = [] } = await query.limit(100);

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground mt-1">{(orders ?? []).length} OS encontradas</p>
        </div>
        <Link href="/os/nova">
          <Button variant="gradient" size="lg"><Plus /> Nova OS</Button>
        </Link>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
        {STATUS_TABS.map((t) => {
          const active = (status ?? "all") === t.value;
          return (
            <Link
              key={t.value}
              href={`/os${t.value !== "all" ? `?status=${t.value}` : ""}`}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent border-border text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <form className="relative max-w-md">
        <Input icon={<Search />} name="q" defaultValue={q ?? ""} placeholder="Buscar OS por problema ou diagnóstico…" />
      </form>

      {(orders ?? []).length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Nenhuma OS encontrada"
          description="Crie sua primeira ordem de serviço para começar."
          action={
            <Link href="/os/nova">
              <Button variant="gradient"><Plus /> Criar OS</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y">
            {(orders ?? []).map((o: any) => (
              <li key={o.id}>
                <Link
                  href={`/os/${o.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="size-12 rounded-xl bg-muted grid place-items-center font-mono text-sm font-bold shrink-0">
                    #{String(o.number).padStart(4, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{o.customer?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {o.vehicle?.brand} {o.vehicle?.model} · {o.vehicle?.plate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <ServiceOrderStatusBadge status={o.status} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(o.created_at)} · {formatCurrency(o.total)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
