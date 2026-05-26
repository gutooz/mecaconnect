import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuoteStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OrcamentosPage() {
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const { data: quotes = [] } = await supabase
    .from("quotes")
    .select("id, number, status, total, valid_until, created_at, customer:customers(full_name), vehicle:vehicles(brand, model, plate)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">{(quotes ?? []).length} orçamentos</p>
        </div>
        <Link href="/orcamentos/novo">
          <Button variant="gradient"><Plus /> Novo orçamento</Button>
        </Link>
      </header>

      {(quotes ?? []).length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Nenhum orçamento ainda"
          description="Crie orçamentos e envie para o cliente aprovar pelo WhatsApp."
          action={
            <Link href="/orcamentos/novo">
              <Button variant="gradient"><Plus /> Criar orçamento</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y">
            {(quotes ?? []).map((q: any) => (
              <li key={q.id}>
                <Link href={`/orcamentos/${q.id}`} className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
                  <div className="size-12 rounded-xl bg-muted grid place-items-center font-mono text-sm font-bold shrink-0">
                    #{String(q.number).padStart(4, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{q.customer?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {q.vehicle ? `${q.vehicle.brand} ${q.vehicle.model} · ${q.vehicle.plate}` : "Sem veículo"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <QuoteStatusBadge status={q.status} />
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(q.created_at)} · {formatCurrency(q.total)}</p>
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
