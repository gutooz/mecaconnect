import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Car, User, Plus, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceOrderStatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export default async function VeiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: vehicle }, { data: orders }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*, customer:customers(id, full_name, phone)")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single(),
    supabase
      .from("service_orders")
      .select("id, number, status, total, current_km, created_at, diagnosis")
      .eq("vehicle_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!vehicle) return notFound();

  return (
    <div className="container py-6 max-w-5xl space-y-6">
      <Link href="/veiculos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 grid place-items-center">
          <Car className="size-7 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {vehicle.brand} {vehicle.model}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {vehicle.year ?? "—"} · {vehicle.color ?? "—"} ·{" "}
            <span className="font-mono font-semibold">{vehicle.plate}</span>
          </p>
        </div>
        <Link href={`/os/nova?vehicle=${vehicle.id}&customer=${vehicle.customer_id}`}>
          <Button variant="gradient"><Plus /> Nova OS</Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">KM atual</p>
          <p className="text-2xl font-bold mt-1">{formatNumber(vehicle.current_km)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">OS realizadas</p>
          <p className="text-2xl font-bold mt-1">{orders?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Combustível</p>
          <p className="text-2xl font-bold mt-1">{vehicle.fuel_type ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Motor</p>
          <p className="text-2xl font-bold mt-1">{vehicle.engine ?? "—"}</p>
        </Card>
      </div>

      {vehicle.customer && (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
              <User className="size-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Proprietário</p>
              <Link href={`/clientes/${vehicle.customer.id}`} className="font-medium hover:underline">
                {vehicle.customer.full_name}
              </Link>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <ClipboardList className="size-4" /> Histórico de manutenção
        </h3>
        {(orders ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma manutenção registrada</p>
        ) : (
          <ul className="space-y-3">
            {(orders ?? []).map((o: any) => (
              <li key={o.id}>
                <Link
                  href={`/os/${o.id}`}
                  className="block p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-muted grid place-items-center font-mono text-xs font-bold">
                      #{String(o.number).padStart(4, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{formatDate(o.created_at)}</p>
                        <ServiceOrderStatusBadge status={o.status} />
                      </div>
                      {o.diagnosis && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{o.diagnosis}</p>}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">{o.current_km ? `${formatNumber(o.current_km)} km` : ""}</p>
                        <p className="text-sm font-semibold">{formatCurrency(o.total)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {vehicle.notes && (
        <Card className="p-6">
          <p className="text-xs text-muted-foreground mb-1">Observações</p>
          <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
        </Card>
      )}
    </div>
  );
}
