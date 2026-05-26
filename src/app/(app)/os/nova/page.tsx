"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Car, Plus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createServiceOrder } from "@/lib/actions";

interface Customer { id: string; full_name: string; phone: string }
interface Vehicle { id: string; brand: string; model: string; plate: string; customer_id: string }

export default function NovaOSPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [customerId, setCustomerId] = React.useState(params.get("customer") ?? "");
  const [vehicleId, setVehicleId] = React.useState(params.get("vehicle") ?? "");

  React.useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("customers").select("id, full_name, phone").order("full_name").limit(500),
      supabase.from("vehicles").select("id, brand, model, plate, customer_id").order("created_at", { ascending: false }).limit(500),
    ]).then(([c, v]) => {
      setCustomers((c.data ?? []) as Customer[]);
      setVehicles((v.data ?? []) as Vehicle[]);
    });
  }, []);

  const customerVehicles = vehicles.filter((v) => v.customer_id === customerId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customerId || !vehicleId) {
      toast.error("Selecione cliente e veículo");
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const os = await createServiceOrder({
        customer_id: customerId,
        vehicle_id: vehicleId,
        reported_problem: (fd.get("reported_problem") as string) || undefined,
        current_km: Number(fd.get("current_km")) || undefined,
        fuel_level: (fd.get("fuel_level") as string) || undefined,
      });
      toast.success(`OS #${String(os.number).padStart(4, "0")} criada!`);
      router.push(`/os/${os.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-3xl space-y-6">
      <Link href="/os" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="size-4 text-primary" />
            <h3 className="font-semibold">Cliente e Veículo</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <select
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setVehicleId(""); }}
                required
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name}</option>
                ))}
              </select>
              <Link href="/clientes/novo" className="text-xs text-primary hover:underline">+ Novo cliente</Link>
            </div>

            <div className="space-y-2">
              <Label>Veículo *</Label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
                disabled={!customerId}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">{customerId ? "Selecione…" : "Selecione um cliente primeiro"}</option>
                {customerVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} — {v.plate}</option>
                ))}
              </select>
              {customerId && (
                <Link href={`/veiculos/novo?customer=${customerId}`} className="text-xs text-primary hover:underline">
                  + Novo veículo
                </Link>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="size-4 text-primary" />
            <h3 className="font-semibold">Recepção do veículo</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current_km">KM atual</Label>
              <Input id="current_km" name="current_km" type="number" placeholder="50000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel_level">Nível de combustível</Label>
              <select
                id="fuel_level"
                name="fuel_level"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">—</option>
                <option value="Reserva">Reserva</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Cheio">Cheio</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported_problem">Problema relatado pelo cliente</Label>
            <Textarea
              id="reported_problem"
              name="reported_problem"
              rows={4}
              placeholder="Ex: Ruído estranho ao frear, luz do motor acesa…"
            />
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/os"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" size="lg" loading={loading}>
            <Plus /> Criar OS
          </Button>
        </div>
      </form>
    </div>
  );
}
