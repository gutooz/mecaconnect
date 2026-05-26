"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer } from "@/lib/actions";

export default function NovoClientePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const customer = await createCustomer({
        full_name: String(fd.get("full_name")),
        phone: String(fd.get("phone")),
        email: (fd.get("email") as string) || undefined,
        document: (fd.get("document") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
        address_street: (fd.get("address_street") as string) || undefined,
        address_number: (fd.get("address_number") as string) || undefined,
        address_neighborhood: (fd.get("address_neighborhood") as string) || undefined,
        address_city: (fd.get("address_city") as string) || undefined,
        address_state: (fd.get("address_state") as string) || undefined,
        address_zip: (fd.get("address_zip") as string) || undefined,
      });
      toast.success("Cliente cadastrado!");
      router.push(`/clientes/${customer.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <div>
        <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">Novo cliente</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" name="full_name" required placeholder="João da Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input id="phone" name="phone" required placeholder="(11) 99999-9999" inputMode="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">CPF / CNPJ</Label>
              <Input id="document" name="document" placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="joao@email.com" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Endereço (opcional)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address_street">Rua</Label>
              <Input id="address_street" name="address_street" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_number">Número</Label>
              <Input id="address_number" name="address_number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_neighborhood">Bairro</Label>
              <Input id="address_neighborhood" name="address_neighborhood" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_city">Cidade</Label>
              <Input id="address_city" name="address_city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_state">UF</Label>
              <Input id="address_state" name="address_state" maxLength={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address_zip">CEP</Label>
              <Input id="address_zip" name="address_zip" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Observações</h3>
          <Textarea name="notes" placeholder="Observações internas sobre o cliente…" rows={3} />
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/clientes"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" loading={loading}>Salvar cliente</Button>
        </div>
      </form>
    </div>
  );
}
