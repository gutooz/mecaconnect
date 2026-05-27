"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Car, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createServiceOrder } from "@/lib/actions";

interface Customer { id: string; full_name: string; phone: string }
interface Vehicle { id: string; brand: string; model: string; plate: string; customer_id: string }
interface Mechanic { id: string; full_name: string; role: string }

interface Props {
  customers: Customer[];
  vehicles: Vehicle[];
  mechanics: Mechanic[];
}

export function NovaOSForm({ customers, vehicles, mechanics }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = React.useState(false);
  const [customerId, setCustomerId] = React.useState(params.get("customer") ?? "");
  const [vehicleId, setVehicleId] = React.useState(params.get("vehicle") ?? "");

  const customerVehicles = vehicles.filter((v) => v.customer_id === customerId);

  const today = new Date().toISOString().slice(0, 16);

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
        expected_delivery_at: (fd.get("expected_delivery_at") as string) || undefined,
        assigned_mechanic_id: (fd.get("assigned_mechanic_id") as string) || undefined,
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
        {/* Cliente e Veículo */}
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

        {/* Recepção do veículo */}
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
            <div className="space-y-2">
              <Label>Data de entrada</Label>
              <Input
                value={new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                disabled
                className="bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Preenchida automaticamente ao criar a OS</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_delivery_at">Data prevista de entrega</Label>
              <Input
                id="expected_delivery_at"
                name="expected_delivery_at"
                type="datetime-local"
                min={today}
              />
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

        {/* Responsável */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="size-4 text-primary" />
            <h3 className="font-semibold">Responsável</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_mechanic_id">Mecânico responsável</Label>
            <select
              id="assigned_mechanic_id"
              name="assigned_mechanic_id"
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Nenhum (atribuir depois)</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
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
