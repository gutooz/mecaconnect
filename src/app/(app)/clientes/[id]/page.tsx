import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Car, ClipboardList, Plus, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceOrderStatusBadge } from "@/components/ui/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, formatPhone, formatDocument, initials, onlyDigits } from "@/lib/utils";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: customer }, { data: vehicles }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("organization_id", organization.id).single(),
    supabase.from("vehicles").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase
      .from("service_orders")
      .select("id, number, status, total, created_at, vehicle:vehicles(brand, model, plate)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!customer) return notFound();

  return (
    <div className="container py-6 max-w-5xl space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary/10 text-primary text-xl">{initials(customer.full_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{customer.full_name}</h1>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Phone className="size-3.5" /> {formatPhone(customer.phone)}</span>
            {customer.email && <span className="flex items-center gap-1.5"><Mail className="size-3.5" /> {customer.email}</span>}
            {customer.document && <span>{formatDocument(customer.document)}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/${onlyDigits(customer.phone)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline"><MessageCircle /> WhatsApp</Button>
          </a>
          <Link href={`/os/nova?customer=${customer.id}`}>
            <Button variant="gradient"><Plus /> Nova OS</Button>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total gasto</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(customer.total_spent)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Última visita</p>
          <p className="text-2xl font-bold mt-1">{customer.last_visit_at ? formatDate(customer.last_visit_at) : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Veículos</p>
          <p className="text-2xl font-bold mt-1">{vehicles?.length ?? 0}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Car className="size-4" /> Veículos</h3>
          <Link href={`/veiculos/novo?customer=${customer.id}`}>
            <Button variant="outline" size="sm"><Plus /> Adicionar</Button>
          </Link>
        </div>
        {(vehicles ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhum veículo cadastrado</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {(vehicles ?? []).map((v: any) => (
              <Link
                key={v.id}
                href={`/veiculos/${v.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/30 transition-colors"
              >
                <div className="size-10 rounded-lg bg-muted grid place-items-center">
                  <Car className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.brand} {v.model} {v.year ?? ""}</p>
                  <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><ClipboardList className="size-4" /> Histórico de OS</h3>
        {(orders ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma OS ainda</p>
        ) : (
          <ul className="divide-y">
            {(orders ?? []).map((o: any) => (
              <li key={o.id}>
                <Link href={`/os/${o.id}`} className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-accent transition-colors">
                  <div className="size-10 rounded-lg bg-muted grid place-items-center font-mono text-xs font-bold">
                    #{String(o.number).padStart(4, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.vehicle?.brand} {o.vehicle?.model} · {o.vehicle?.plate}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)} · {formatCurrency(o.total)}</p>
                  </div>
                  <ServiceOrderStatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {(customer.address_street || customer.notes) && (
        <Card className="p-6 space-y-3">
          {customer.address_street && (
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Endereço</p>
              <p className="text-sm mt-1">
                {customer.address_street}, {customer.address_number} — {customer.address_neighborhood}, {customer.address_city}/{customer.address_state}
              </p>
            </div>
          )}
          {customer.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
