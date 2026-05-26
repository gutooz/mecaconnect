import { notFound } from "next/navigation";
import { Wrench, Car, FileText, CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { QuoteStatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = await createAdminClient();

  const { data: q } = await admin
    .from("quotes")
    .select(`
      *,
      customer:customers(full_name, phone),
      vehicle:vehicles(brand, model, plate),
      organization:organizations(name, phone),
      items:quote_items(description, quantity, unit_price, total)
    `)
    .eq("public_token", token)
    .single();
  if (!q) return notFound();

  const org = (q.organization as any);
  const v = (q.vehicle as any);
  const items = (q as any).items ?? [];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container max-w-2xl py-6 flex items-center gap-3">
          <div className="size-11 rounded-xl gradient-brand grid place-items-center shadow-lg">
            <Wrench className="size-5 text-white" />
          </div>
          <div>
            <p className="font-bold">{org?.name ?? "MecaConnect"}</p>
            <p className="text-xs text-muted-foreground">Orçamento</p>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl py-6 space-y-4">
        <Card className="p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Orçamento</p>
          <h1 className="text-3xl font-bold font-mono mt-1">#{String(q.number).padStart(4, "0")}</h1>
          <div className="mt-3"><QuoteStatusBadge status={q.status as any} /></div>
          {q.valid_until && <p className="text-xs text-muted-foreground mt-2">Válido até {formatDate(q.valid_until)}</p>}
        </Card>

        {v && (
          <Card className="p-6 flex items-center gap-3">
            <Car className="size-5 text-primary" />
            <div>
              <p className="font-semibold">{v.brand} {v.model}</p>
              <p className="text-sm text-muted-foreground font-mono">{v.plate}</p>
            </div>
          </Card>
        )}

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
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-bold">{formatCurrency(q.total)}</span>
          </div>
        </Card>

        {q.notes && (
          <Card className="p-6">
            <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
            <p className="text-sm whitespace-pre-wrap">{q.notes}</p>
          </Card>
        )}

        {org?.phone && (
          <a href={`https://wa.me/${org.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="block">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Aprovar orçamento</p>
                  <p className="text-xs text-muted-foreground">Entre em contato pelo WhatsApp</p>
                </div>
              </div>
            </Card>
          </a>
        )}
      </div>
    </div>
  );
}
