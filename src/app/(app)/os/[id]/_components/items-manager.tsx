"use client";

import * as React from "react";
import { Plus, Wrench, Package, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { addServiceOrderItem, removeServiceOrderItem } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import type { ServiceOrderItem } from "@/types/database";

const TYPE_META = {
  service: { label: "Serviço", icon: Wrench, color: "bg-blue-500/10 text-blue-600" },
  part: { label: "Peça", icon: Package, color: "bg-emerald-500/10 text-emerald-600" },
  labor: { label: "Mão de obra", icon: Settings2, color: "bg-violet-500/10 text-violet-600" },
  other: { label: "Outro", icon: Settings2, color: "bg-muted text-muted-foreground" },
} as const;

export function OSItemsManager({ osId, items }: { osId: string; items: ServiceOrderItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await addServiceOrderItem({
        service_order_id: osId,
        description: String(fd.get("description")),
        quantity: Number(fd.get("quantity")),
        unit_price: Number(fd.get("unit_price")),
        item_type: fd.get("item_type") as any,
      });
      toast.success("Item adicionado");
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Remover este item?")) return;
    try {
      await removeServiceOrderItem(id, osId);
      toast.success("Item removido");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Serviços e peças</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar item</DialogTitle>
            </DialogHeader>
            <form onSubmit={onAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Tipo</Label>
                <select
                  id="item_type"
                  name="item_type"
                  required
                  defaultValue="service"
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="service">Serviço</option>
                  <option value="part">Peça</option>
                  <option value="labor">Mão de obra</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input id="description" name="description" required placeholder="Ex: Troca de óleo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" defaultValue="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Valor unit. *</Label>
                  <Input id="unit_price" name="unit_price" type="number" step="0.01" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="gradient" loading={pending}>Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum item ainda. Adicione serviços e peças.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const meta = TYPE_META[it.item_type as keyof typeof TYPE_META] ?? TYPE_META.other;
            const Icon = meta.icon;
            return (
              <li key={it.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`size-9 rounded-lg grid place-items-center ${meta.color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {meta.label} · {it.quantity}× {formatCurrency(it.unit_price)}
                  </p>
                </div>
                <p className="font-semibold whitespace-nowrap">{formatCurrency(it.total)}</p>
                <Button variant="ghost" size="icon" onClick={() => onRemove(it.id)} className="text-destructive">
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
