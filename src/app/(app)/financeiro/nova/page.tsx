"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction } from "@/lib/actions";

export default function NovaTransacaoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const initialType = (params.get("type") as "income" | "expense") ?? "income";
  const [type, setType] = React.useState<"income" | "expense">(initialType);
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>([]);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.from("financial_categories").select("*").eq("type", type).then(({ data }) => setCategories(data ?? []));
  }, [type]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createTransaction({
        type,
        description: String(fd.get("description")),
        amount: Number(fd.get("amount")),
        due_date: (fd.get("due_date") as string) || undefined,
        payment_status: (fd.get("payment_status") as any) || "pending",
        payment_method: (fd.get("payment_method") as string) || undefined,
        category_id: (fd.get("category_id") as string) || undefined,
      });
      toast.success("Movimentação registrada!");
      router.push("/financeiro");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-xl space-y-6">
      <Link href="/financeiro" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        Nova {type === "income" ? "receita" : "despesa"}
      </h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
            type === "income" ? "border-success bg-success/10 text-success" : "border-border"
          }`}
        >
          Receita
        </button>
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
            type === "expense" ? "border-destructive bg-destructive/10 text-destructive" : "border-border"
          }`}
        >
          Despesa
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input id="description" name="description" required placeholder="Ex: Pagamento OS #001" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <select id="category_id" name="category_id" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de pagamento</Label>
              <select id="payment_method" name="payment_method" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">—</option>
                <option value="cash">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="debit_card">Débito</option>
                <option value="credit_card">Crédito</option>
                <option value="bank_transfer">Transferência</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment_status">Status</Label>
              <select id="payment_status" name="payment_status" defaultValue="pending" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="pending">Pendente</option>
                <option value="paid">{type === "income" ? "Recebido" : "Pago"}</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/financeiro"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" loading={loading}><Plus /> Registrar</Button>
        </div>
      </form>
    </div>
  );
}
