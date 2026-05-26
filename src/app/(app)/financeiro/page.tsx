import Link from "next/link";
import {
  Plus, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, TrendingUp, TrendingDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function FinanceiroPage() {
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [{ data: transactions = [] }, { data: monthData = [] }] = await Promise.all([
    supabase
      .from("financial_transactions")
      .select("*, category:financial_categories(name, color)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("financial_transactions")
      .select("type, amount, payment_status")
      .eq("organization_id", organization.id)
      .gte("created_at", startOfMonth),
  ]);

  const stats = (monthData ?? []).reduce(
    (acc, t: any) => {
      const amount = Number(t.amount);
      if (t.type === "income" && t.payment_status === "paid") acc.received += amount;
      if (t.type === "income" && t.payment_status === "pending") acc.toReceive += amount;
      if (t.type === "expense" && t.payment_status === "paid") acc.paid += amount;
      if (t.type === "expense" && t.payment_status === "pending") acc.toPay += amount;
      return acc;
    },
    { received: 0, toReceive: 0, paid: 0, toPay: 0 },
  );

  const profit = stats.received - stats.paid;

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          <Link href="/financeiro/nova?type=expense"><Button variant="outline"><ArrowDownCircle /> Despesa</Button></Link>
          <Link href="/financeiro/nova?type=income"><Button variant="gradient"><ArrowUpCircle /> Receita</Button></Link>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<TrendingUp />} label="Recebido (mês)" value={formatCurrency(stats.received)} accent="emerald" />
        <StatCard icon={<TrendingDown />} label="Pago (mês)" value={formatCurrency(stats.paid)} accent="rose" />
        <StatCard icon={<Calendar />} label="A receber" value={formatCurrency(stats.toReceive)} accent="amber" />
        <StatCard icon={<Wallet />} label="Lucro do mês" value={formatCurrency(profit)} accent="blue" />
      </div>

      <Card>
        <div className="p-5 border-b">
          <h3 className="font-semibold">Movimentações recentes</h3>
        </div>
        {(transactions ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Nenhuma movimentação ainda</p>
        ) : (
          <ul className="divide-y">
            {(transactions ?? []).map((t: any) => {
              const income = t.type === "income";
              return (
                <li key={t.id} className="flex items-center gap-3 p-4">
                  <div
                    className={`size-10 rounded-xl grid place-items-center ${
                      income ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {income ? <ArrowUpCircle className="size-5" /> : <ArrowDownCircle className="size-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category?.name ?? "Sem categoria"} · {formatDate(t.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold ${income ? "text-emerald-600" : "text-rose-600"}`}>
                      {income ? "+" : "−"} {formatCurrency(t.amount)}
                    </p>
                    <PaymentStatusBadge status={t.payment_status} className="mt-1" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "emerald" | "rose" | "amber" | "blue" }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    rose: "bg-rose-500/10 text-rose-600",
    amber: "bg-amber-500/10 text-amber-600",
    blue: "bg-blue-500/10 text-blue-600",
  } as const;
  return (
    <Card className="p-4 lg:p-5">
      <div className={`size-10 rounded-xl grid place-items-center mb-3 ${colors[accent]}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl lg:text-2xl font-bold mt-1">{value}</p>
    </Card>
  );
}
