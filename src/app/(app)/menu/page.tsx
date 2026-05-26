import Link from "next/link";
import { ChevronRight, Settings, LogOut } from "lucide-react";
import { NAV } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";

export default function MenuPage() {
  return (
    <div className="container py-6 space-y-4 lg:hidden">
      <h1 className="text-2xl font-bold tracking-tight">Menu</h1>

      <Card>
        <ul className="divide-y">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center gap-3 p-4">
                <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <item.icon className="size-4" />
                </div>
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <Link href="/configuracoes" className="flex items-center gap-3 p-4">
          <div className="size-10 rounded-lg bg-muted text-muted-foreground grid place-items-center">
            <Settings className="size-4" />
          </div>
          <span className="flex-1 font-medium">Configurações</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </Card>
    </div>
  );
}
