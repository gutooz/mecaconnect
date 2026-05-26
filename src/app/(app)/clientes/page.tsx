import Link from "next/link";
import { Plus, Users, Phone, Mail, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatPhone, initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { organization } = await getSessionData();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organization.id)
    .order("full_name", { ascending: true });
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,document.ilike.%${q}%`);

  const { data: customers = [] } = await query.limit(100);

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{(customers ?? []).length} clientes cadastrados</p>
        </div>
        <Link href="/clientes/novo">
          <Button variant="gradient"><Plus /> Novo cliente</Button>
        </Link>
      </header>

      <form className="relative max-w-md">
        <Input icon={<Search />} name="q" defaultValue={q ?? ""} placeholder="Buscar por nome, telefone ou CPF…" />
      </form>

      {(customers ?? []).length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Nenhum cliente ainda"
          description="Cadastre seu primeiro cliente ou crie uma OS — ele será adicionado automaticamente."
          action={
            <Link href="/clientes/novo">
              <Button variant="gradient"><Plus /> Cadastrar cliente</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(customers ?? []).map((c: any) => (
            <Link key={c.id} href={`/clientes/${c.id}`}>
              <Card className="p-4 hover:border-primary/30 hover:shadow-md transition-all h-full">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {initials(c.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.full_name}</p>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Phone className="size-3" /> {formatPhone(c.phone)}</p>
                      {c.email && <p className="flex items-center gap-1.5 truncate"><Mail className="size-3" /> {c.email}</p>}
                    </div>
                    {c.total_spent > 0 && (
                      <p className="mt-2 text-xs font-medium text-success">{formatCurrency(c.total_spent)} em serviços</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
