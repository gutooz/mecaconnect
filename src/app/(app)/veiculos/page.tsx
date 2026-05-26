import Link from "next/link";
import { Plus, Car, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber } from "@/lib/utils";

export default async function VeiculosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { organization } = await getSessionData();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("vehicles")
    .select("*, customer:customers(full_name)")
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });
  if (q) query = query.or(`plate.ilike.%${q.toUpperCase()}%,brand.ilike.%${q}%,model.ilike.%${q}%`);

  const { data: vehicles = [] } = await query.limit(100);

  return (
    <div className="container py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Veículos</h1>
          <p className="text-sm text-muted-foreground mt-1">{(vehicles ?? []).length} veículos cadastrados</p>
        </div>
        <Link href="/veiculos/novo">
          <Button variant="gradient"><Plus /> Novo veículo</Button>
        </Link>
      </header>

      <form className="relative max-w-md">
        <Input icon={<Search />} name="q" defaultValue={q ?? ""} placeholder="Buscar por placa, marca ou modelo…" />
      </form>

      {(vehicles ?? []).length === 0 ? (
        <EmptyState
          icon={<Car />}
          title="Nenhum veículo ainda"
          description="Cadastre o primeiro veículo da sua oficina."
          action={
            <Link href="/veiculos/novo">
              <Button variant="gradient"><Plus /> Cadastrar veículo</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(vehicles ?? []).map((v: any) => (
            <Link key={v.id} href={`/veiculos/${v.id}`}>
              <Card className="p-4 hover:border-primary/30 hover:shadow-md transition-all h-full">
                <div className="flex items-start gap-3">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 grid place-items-center shrink-0">
                    <Car className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{v.brand} {v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.year ?? "—"} · {v.color ?? "—"}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-md bg-muted font-mono text-xs font-bold tracking-wider">
                      {v.plate}
                    </div>
                    {v.customer && (
                      <p className="mt-2 text-xs text-muted-foreground truncate">👤 {v.customer.full_name}</p>
                    )}
                    {v.current_km > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">{formatNumber(v.current_km)} km</p>
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
