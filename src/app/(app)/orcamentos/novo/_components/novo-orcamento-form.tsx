"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuote } from "@/lib/actions";

interface Customer { id: string; full_name: string }
interface Vehicle { id: string; brand: string; model: string; plate: string; customer_id: string }

interface Props {
  customers: Customer[];
  vehicles: Vehicle[];
}

export function NovoOrcamentoForm({ customers, vehicles }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [customerId, setCustomerId] = React.useState("");

  const customerVehicles = vehicles.filter((v) => v.customer_id === customerId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const q = await createQuote({
        customer_id: customerId,
        vehicle_id: (fd.get("vehicle_id") as string) || undefined,
        valid_until: (fd.get("valid_until") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      toast.success("Orçamento criado!");
      router.push(`/orcamentos/${q.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <Link href="/orcamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Novo orçamento</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicle_id">Veículo</Label>
            <select
              id="vehicle_id"
              name="vehicle_id"
              disabled={!customerId}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="">—</option>
              {customerVehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valid_until">Validade</Label>
            <Input id="valid_until" name="valid_until" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Detalhes do orçamento…" />
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/orcamentos"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" loading={loading}><Plus /> Criar orçamento</Button>
        </div>
      </form>
    </div>
  );
}
