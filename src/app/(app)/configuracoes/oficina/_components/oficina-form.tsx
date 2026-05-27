"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganization } from "@/lib/actions";

interface OrgData {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export function OficinaForm({ org }: { org: OrgData }) {
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await updateOrganization({
        name: String(fd.get("name")),
        cnpj: (fd.get("cnpj") as string) || null,
        phone: (fd.get("phone") as string) || null,
        email: (fd.get("email") as string) || null,
        address: (fd.get("address") as string) || null,
      });
      toast.success("Dados salvos!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <Link href="/configuracoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dados da oficina</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" defaultValue={org.name} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" defaultValue={org.cnpj ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={org.phone ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={org.email ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea id="address" name="address" defaultValue={org.address ?? ""} rows={2} />
            </div>
          </div>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" variant="gradient" loading={saving}><Save /> Salvar</Button>
        </div>
      </form>
    </div>
  );
}
