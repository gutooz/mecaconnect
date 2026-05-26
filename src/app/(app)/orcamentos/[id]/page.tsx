import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, Wrench, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuoteStatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, onlyDigits } from "@/lib/utils";
import { QuoteActions } from "./_components/actions";

export default async function OrcamentoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: q }, { data: items }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*, customer:customers(id, full_name, phone), vehicle:vehicles(brand, model, plate)")
      .eq("id", id).eq("organization_id", organization.id).single(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("created_at"),
  ]);
  if (!q) return notFound();

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/orcamento/public/${q.public_token}`;
  const waLink = `https://wa.me/${onlyDigits((q.customer as any)?.phone)}?text=${encodeURIComponent(
    `Olá ${(q.customer as any)?.full_name}! Seu orçamento #${String(q.number).padStart(4, "0")} está disponível: ${publicUrl}`,
  )}`;

  return (
    <div className="container py-6 max-w-4xl space-y-6">
      <Link href="/orcamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <header className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-white grid place-items-center font-mono text-base font-bold shrink-0">
          #{String(q.number).padStart(4, "0")}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{(q.customer as any)?.full_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(q.vehicle as any) ? `${(q.vehicle as any).brand} ${(q.vehicle as any).model} · ${(q.vehicle as any).plate}` : "—"}
          </p>
        </div>
        <QuoteStatusBadge status={q.status} />
      </header>

      <QuoteActions id={q.id} status={q.status} waLink={waLink} />

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Itens do orçamento</h3>
        {(items ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum item ainda</p>
        ) : (
          <ul className="divide-y">
            {(items ?? []).map((it: any) => (
              <li key={it.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.description}</p>
                  <p className="text-xs text-muted-foreground">{it.quantity}× {formatCurrency(it.unit_price)}</p>
                </div>
                <p className="font-semibold">{formatCurrency(it.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatCurrency(q.subtotal)}</dd></div>
          {q.discount > 0 && <div className="flex justify-between text-success"><dt>Desconto</dt><dd>− {formatCurrency(q.discount)}</dd></div>}
          <Separator />
          <div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>{formatCurrency(q.total)}</dd></div>
        </dl>
        {q.valid_until && (
          <p className="text-xs text-muted-foreground mt-3">Válido até {formatDate(q.valid_until)}</p>
        )}
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <Share2 className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Link público</h3>
            <code className="block mt-2 p-2.5 bg-background border rounded-lg text-xs break-all">{publicUrl}</code>
          </div>
        </div>
      </Card>
    </div>
  );
}
