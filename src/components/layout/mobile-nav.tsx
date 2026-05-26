"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Users,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

const PRIMARY: readonly NavItem[] = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/os", label: "OS", icon: ClipboardList },
  { href: "/os/nova", label: "Nova OS", icon: Plus, primary: true },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/menu", label: "Mais", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur-xl safe-bottom">
      <ul className="grid grid-cols-5">
        {PRIMARY.map((item) => {
          const active = pathname === item.href;
          if (item.primary) {
            return (
              <li key={item.href} className="flex justify-center">
                <Link
                  href={item.href}
                  className="-mt-5 size-14 rounded-2xl gradient-brand grid place-items-center shadow-xl shadow-brand-500/30 active:scale-95 transition-transform"
                >
                  <item.icon className="size-6 text-white" />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("size-5", active && "text-primary")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
