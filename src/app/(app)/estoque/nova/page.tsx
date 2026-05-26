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
import { createPart } from "@/lib/actions";

export default function NovaPecaPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createPart({
        name: String(fd.get("name")),
        sku: (fd.get("sku") as string) || undefined,
        barcode: (fd.get("barcode") as string) || undefined,
        category: (fd.get("category") as string) || undefined,
        cost_price: Number(fd.get("cost_price")) || 0,
        sale_price: Number(fd.get("sale_price")) || 0,
        stock_quantity: Number(fd.get("stock_quantity")) || 0,
        min_stock: Number(fd.get("min_stock")) || 0,
        location: (fd.get("location") as string) || undefined,
      });
      toast.success("Peça cadastrada!");
      router.push("/estoque");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <Link href="/estoque" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova peça</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required placeholder="Filtro de óleo Bosch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Código</Label>
              <Input id="sku" name="sku" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Cód. de barras</Label>
              <Input id="barcode" name="barcode" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" placeholder="Filtros" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input id="location" name="location" placeholder="Prateleira A-3" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Preços e estoque</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cost_price">Preço de custo</Label>
              <Input id="cost_price" name="cost_price" type="number" step="0.01" placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Preço de venda *</Label>
              <Input id="sale_price" name="sale_price" type="number" step="0.01" required placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Quantidade inicial</Label>
              <Input id="stock_quantity" name="stock_quantity" type="number" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Estoque mínimo</Label>
              <Input id="min_stock" name="min_stock" type="number" defaultValue="0" />
            </div>
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/estoque"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" loading={loading}><Plus /> Cadastrar peça</Button>
        </div>
      </form>
    </div>
  );
}
