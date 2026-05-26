"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVehicle } from "@/lib/actions";

export default function NovoVeiculoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedCustomer = params.get("customer");
  const [loading, setLoading] = React.useState(false);
  const [customers, setCustomers] = React.useState<Array<{ id: string; full_name: string }>>([]);

  React.useEffect(() => {
    const supabase = createClient();
    supabase
      .from("customers")
      .select("id, full_name")
      .order("full_name", { ascending: true })
      .limit(500)
      .then(({ data }) => setCustomers(data ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const vehicle = await createVehicle({
        customer_id: String(fd.get("customer_id")),
        brand: String(fd.get("brand")),
        model: String(fd.get("model")),
        year: Number(fd.get("year")) || undefined,
        plate: String(fd.get("plate")),
        color: (fd.get("color") as string) || undefined,
        current_km: Number(fd.get("current_km")) || undefined,
        chassis: (fd.get("chassis") as string) || undefined,
        engine: (fd.get("engine") as string) || undefined,
        fuel_type: (fd.get("fuel_type") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
      });
      toast.success("Veículo cadastrado!");
      router.push(`/veiculos/${vehicle.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <Link href="/veiculos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Novo veículo</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_id">Cliente *</Label>
            <select
              id="customer_id"
              name="customer_id"
              required
              defaultValue={preselectedCustomer ?? ""}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione o cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input id="plate" name="plate" required maxLength={8} placeholder="ABC1D23" style={{ textTransform: "uppercase" }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input id="year" name="year" type="number" placeholder="2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input id="brand" name="brand" required placeholder="Volkswagen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input id="model" name="model" required placeholder="Gol" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input id="color" name="color" placeholder="Prata" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_km">KM atual</Label>
              <Input id="current_km" name="current_km" type="number" placeholder="50000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel_type">Combustível</Label>
              <Input id="fuel_type" name="fuel_type" placeholder="Flex" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engine">Motor</Label>
              <Input id="engine" name="engine" placeholder="1.0" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="chassis">Chassi</Label>
              <Input id="chassis" name="chassis" placeholder="9BWXXX..." />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea name="notes" rows={3} />
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/veiculos"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" loading={loading}>Salvar veículo</Button>
        </div>
      </form>
    </div>
  );
}
