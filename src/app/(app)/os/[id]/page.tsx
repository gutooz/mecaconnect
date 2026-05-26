import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Car, User, Phone, Share2, FileText, Printer, MessageCircle, Calendar, Gauge,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ServiceOrderStatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDateTime, formatNumber, formatPhone, onlyDigits } from "@/lib/utils";
import { OSStatusSelect } from "./_components/status-select";
import { OSItemsManager } from "./_components/items-manager";

export default async function OSDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: os }, { data: items }] = await Promise.all([
    supabase
      .from("service_orders")
      .select(`
        *,
        customer:customers(id, full_name, phone),
        vehicle:vehicles(id, brand, model, plate, year, color),
        mechanic:profiles!service_orders_assigned_mechanic_id_fkey(full_name)
      `)
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single(),
    supabase.from("service_order_items").select("*").eq("service_order_id", id).order("created_at"),
  ]);

  if (!os) return notFound();

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/os/public/${os.public_token}`;
  const waMessage = `Olá ${os.customer?.full_name}! Acompanhe sua OS #${String(os.number).padStart(4, "0")}: ${publicUrl}`;
  const waLink = `https://wa.me/${onlyDigits(os.customer?.phone)}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="container py-6 max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/os" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <div className="flex gap-2">
          <a href={waLink} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><MessageCircle /> WhatsApp</Button>
          </a>
          <Link href={`/os/${id}/imprimir`} target="_blank">
            <Button variant="outline" size="sm"><Printer /> PDF</Button>
          </Link>
        </div>
      </div>

      <header className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white grid place-items-center font-mono text-base font-bold shrink-0">
          #{String(os.number).padStart(4, "0")}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {(os.vehicle as any)?.brand} {(os.vehicle as any)?.model}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Criada em {formatDateTime(os.created_at)} · Total {formatCurrency(os.total)}
          </p>
        </div>
        <OSStatusSelect id={os.id} status={os.status} />
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
              <User className="size-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</p>
          </div>
          <Link href={`/clientes/${(os.customer as any)?.id}`} className="font-semibold hover:underline">
            {(os.customer as any)?.full_name}
          </Link>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Phone className="size-3" /> {formatPhone((os.customer as any)?.phone)}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
              <Car className="size-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Veículo</p>
          </div>
          <Link href={`/veiculos/${(os.vehicle as any)?.id}`} className="font-semibold hover:underline">
            {(os.vehicle as any)?.brand} {(os.vehicle as any)?.model}
          </Link>
          <p className="text-sm text-muted-foreground font-mono mt-1">{(os.vehicle as any)?.plate}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-primary/10 grid place-items-center">
              <Gauge className="size-4 text-primary" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recepção</p>
          </div>
          <p className="font-semibold">{os.current_km ? `${formatNumber(os.current_km)} km` : "—"}</p>
          <p className="text-sm text-muted-foreground mt-1">Combustível: {os.fuel_level ?? "—"}</p>
        </Card>
      </div>

      {(os.reported_problem || os.diagnosis) && (
        <Card className="p-6 space-y-4">
          {os.reported_problem && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Problema relatado</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{os.reported_problem}</p>
            </div>
          )}
          {os.diagnosis && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-1">Diagnóstico</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{os.diagnosis}</p>
              </div>
            </>
          )}
        </Card>
      )}

      <OSItemsManager osId={os.id} items={items ?? []} />

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Resumo financeiro</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Serviços</dt>
            <dd>{formatCurrency(os.services_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Peças</dt>
            <dd>{formatCurrency(os.parts_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Mão de obra</dt>
            <dd>{formatCurrency(os.labor_total)}</dd>
          </div>
          {os.discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>Desconto</dt>
              <dd>− {formatCurrency(os.discount)}</dd>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <dt>Total</dt>
            <dd>{formatCurrency(os.total)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
            <Share2 className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Link público para o cliente</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Compartilhe este link para o cliente acompanhar a OS em tempo real.
            </p>
            <code className="block mt-3 p-2.5 bg-background border rounded-lg text-xs break-all">
              {publicUrl}
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
}
