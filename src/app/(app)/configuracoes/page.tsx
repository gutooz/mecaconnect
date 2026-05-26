import { Building2, MessageCircle, Users as UsersIcon, Bell, Palette, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getSessionData } from "@/lib/auth";
import { Card } from "@/components/ui/card";

export default async function ConfiguracoesPage() {
  const { organization, profile } = await getSessionData();

  const sections = [
    { href: "/configuracoes/oficina", icon: Building2, label: "Dados da oficina", desc: organization.name },
    { href: "/configuracoes/perfil", icon: UsersIcon, label: "Perfil e equipe", desc: profile.full_name },
    { href: "/whatsapp", icon: MessageCircle, label: "WhatsApp", desc: organization.whatsapp_connected ? "Conectado" : "Desconectado" },
    { href: "/configuracoes/notificacoes", icon: Bell, label: "Notificações", desc: "Preferências de alerta" },
    { href: "/configuracoes/aparencia", icon: Palette, label: "Aparência", desc: "Tema e cores" },
  ];

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>

      <Card>
        <ul className="divide-y">
          {sections.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
                <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <s.icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
