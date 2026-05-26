import Link from "next/link";
import { Plus, Package, AlertTriangle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function EstoquePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { organization } = await getSessionData();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("parts")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("active", true)
    .order("name", { ascending: true });
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);

  const { data: parts = [] } = await query.limit(200);

  const totals = (parts ?? []).reduce(
    (acc, p: any) => ({
      total: acc.total + p.stock_quantity * (Number(p.cost_price) || 0),
      lowStock: acc.lowStock + (p.stock_quantity <= p.min_stock ? 1 : 0),
      items: acc.items + 1,
    }),
    { total: 0, lowStock: 0, items: 0 },
  );

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1">{totals.items} peças cadastradas</p>
        </div>
        <Link href="/estoque/nova">
          <Button variant="gradient"><Plus /> Nova peça</Button>
        </Link>
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Valor em estoque</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totals.total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          <p className="text-2xl font-bold mt-1">{totals.items}</p>
        </Card>
        <Card className={`p-5 ${totals.lowStock > 0 ? "border-warning/40 bg-warning/5" : ""}`}>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {totals.lowStock > 0 && <AlertTriangle className="size-3 text-warning" />} Estoque baixo
          </p>
          <p className="text-2xl font-bold mt-1">{totals.lowStock}</p>
        </Card>
      </div>

      <form className="relative max-w-md">
        <Input icon={<Search />} name="q" defaultValue={q ?? ""} placeholder="Buscar peça por nome, SKU ou código de barras…" />
      </form>

      {(parts ?? []).length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Estoque vazio"
          description="Cadastre suas peças para começar a controlar o estoque."
          action={
            <Link href="/estoque/nova">
              <Button variant="gradient"><Plus /> Cadastrar peça</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y">
            {(parts ?? []).map((p: any) => {
              const low = p.stock_quantity <= p.min_stock;
              return (
                <li key={p.id} className="flex items-center gap-3 p-4">
                  <div className="size-11 rounded-lg bg-muted grid place-items-center shrink-0">
                    <Package className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku && <span className="font-mono">{p.sku}</span>}
                      {p.category && <span> · {p.category}</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 justify-end">
                      {low && <Badge variant="warning"><AlertTriangle className="size-3" /> Baixo</Badge>}
                      <span className="font-semibold">{formatNumber(p.stock_quantity)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(p.sale_price)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
