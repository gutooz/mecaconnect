"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function OficinaConfigPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
      if (!p?.organization_id) return;
      const { data: org } = await supabase.from("organizations").select("*").eq("id", p.organization_id).single();
      setData(org);
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase
      .from("organizations")
      .update({
        name: String(fd.get("name")),
        cnpj: (fd.get("cnpj") as string) || null,
        phone: (fd.get("phone") as string) || null,
        email: (fd.get("email") as string) || null,
        address: (fd.get("address") as string) || null,
      })
      .eq("id", data.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Dados salvos!");
  }

  if (loading) return <div className="container py-10">Carregando…</div>;

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
            <Input id="name" name="name" defaultValue={data.name} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" defaultValue={data.cnpj ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={data.phone ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={data.email ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea id="address" name="address" defaultValue={data.address ?? ""} rows={2} />
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
