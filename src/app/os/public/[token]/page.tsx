import { notFound } from "next/navigation";
import { Wrench, Car, CheckCircle2, Phone, Clock, MessageCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ServiceOrderStatusBadge, OS_STATUS_LABEL } from "@/components/ui/status-badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { ServiceOrderStatus } from "@/types/database";

const TIMELINE: ServiceOrderStatus[] = [
  "received", "analyzing", "awaiting_approval", "in_progress", "completed", "delivered",
];

export default async function PublicOSPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await createAdminClient();

  const { data: os } = await admin
    .from("service_orders")
    .select(`
      *,
      customer:customers(full_name, phone),
      vehicle:vehicles(brand, model, plate, year, color),
      organization:organizations(name, phone, primary_color),
      items:service_order_items(description, quantity, unit_price, total, item_type)
    `)
    .eq("public_token", token)
    .single();
  if (!os) return notFound();

  const v = (os.vehicle as any);
  const org = (os.organization as any);
  const customer = (os.customer as any);
  const items = (os as any).items ?? [];
  const currentIdx = TIMELINE.indexOf(os.status as ServiceOrderStatus);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container max-w-2xl py-6 flex items-center gap-3">
          <div className="size-11 rounded-xl gradient-brand grid place-items-center shadow-lg">
            <Wrench className="size-5 text-white" />
          </div>
          <div>
            <p className="font-bold">{org?.name ?? "MecaConnect"}</p>
            <p className="text-xs text-muted-foreground">Acompanhe sua ordem de serviço</p>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-6 space-y-4">
        <Card className="p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Ordem de Serviço</p>
          <h1 className="text-3xl font-bold font-mono mt-1">#{String(os.number).padStart(4, "0")}</h1>
          <div className="mt-3">
            <ServiceOrderStatusBadge status={os.status as any} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 grid place-items-center shrink-0">
              <Car className="size-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{v?.brand} {v?.model}</p>
              <p className="text-sm text-muted-foreground font-mono">{v?.plate}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Status atual</h3>
          <ol className="space-y-3">
            {TIMELINE.map((status, idx) => {
              const done = idx <= currentIdx;
              const active = idx === currentIdx;
              return (
                <li key={status} className="flex items-center gap-3">
                  <div className={`size-9 rounded-full grid place-items-center shrink-0 transition-all ${
                    done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  } ${active ? "ring-4 ring-success/20" : ""}`}>
                    {done ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${active ? "font-semibold" : ""}`}>{OS_STATUS_LABEL[status]}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        {items.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-3">Itens</h3>
            <ul className="divide-y">
              {items.map((it: any, i: number) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.description}</p>
                    <p className="text-xs text-muted-foreground">{it.quantity}× {formatCurrency(it.unit_price)}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(it.total)}</p>
                </li>
              ))}
            </ul>
            <div className="border-t mt-3 pt-3 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">{formatCurrency(os.total)}</span>
            </div>
          </Card>
        )}

        {org?.phone && (
          <a
            href={`https://wa.me/${org.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="p-4 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                  <MessageCircle className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Falar com a oficina</p>
                  <p className="text-xs text-muted-foreground">{org.phone}</p>
                </div>
                <Phone className="size-4 text-muted-foreground" />
              </div>
            </Card>
          </a>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          Atualizado em {formatDateTime(os.updated_at)}
        </p>
      </div>
    </div>
  );
}
