import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Wallet,
  Boxes,
  ClipboardList,
  Users,
  BarChart3,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const NAV = [
  { href: "#recursos", label: "Recursos" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#planos", label: "Planos" },
  { href: "#sobre", label: "Sobre" },
  { href: "#contato", label: "Contato" },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Ordens de Serviço",
    desc: "Crie, acompanhe e gerencie todas as OS da sua oficina de forma simples e eficiente.",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    desc: "Histórico completo de clientes e veículos para um atendimento personalizado.",
  },
  {
    icon: Boxes,
    title: "Estoque Inteligente",
    desc: "Controle de peças, estoque mínimo, fornecedores e movimentações.",
  },
  {
    icon: Wallet,
    title: "Financeiro Completo",
    desc: "Contas a pagar e receber, fluxo de caixa e relatórios financeiros.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e Indicadores",
    desc: "Dashboards e relatórios para tomar decisões com base em dados reais.",
  },
  {
    icon: Smartphone,
    title: "Acesso em qualquer lugar",
    desc: "Sistema 100% online. Acesse de qualquer dispositivo, quando e onde quiser.",
  },
];

const PARTNERS = ["AUTO+ OFICINA", "POWER MECÂNICA", "TOPCAR SERVICE", "FORZA MOTORS", "MASTER AUTO CENTER"];

const CHECKS = ["Mais organização", "Mais controle", "Mais resultados"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo href="/" size="md" priority />
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient">Comece grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden gradient-mesh">
        <div className="container py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.05]">
              Conecte sua oficina.
              <br />
              Gerencie seu{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent">
                sucesso.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              O MecaConnect é o sistema completo para mecânicas que querem mais controle, produtividade
              e lucro.
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm font-medium">
                  <span className="grid place-items-center size-5 rounded-full bg-primary/15">
                    <CheckCircle2 className="size-3.5 text-primary" />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  Comece grátis <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="#contato">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  <Calendar className="size-4" /> Agendar demonstração
                </Button>
              </Link>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Teste grátis por 15 dias. Sem cartão de crédito.
            </p>
          </div>

          {/* CEOs */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Glow ambiente azul-ciano por trás dos CEOs */}
            <div className="absolute inset-0 -z-10 blur-3xl opacity-40">
              <div className="size-full rounded-full bg-gradient-to-b from-primary/50 via-brand-400/20 to-transparent" />
            </div>

            {/* Imagem sem fundo — flutua direto sobre o site */}
            <div className="relative max-w-md w-full">
              <Image
                src="/ceos-nobg.png"
                alt="Gustavo e Gabriel — Co-CEOs do MecaConnect"
                width={480}
                height={420}
                className="w-full object-contain drop-shadow-[0_0_40px_rgba(30,156,255,0.20)]"
                priority
              />
              {/* Fade sutil na base para ancorar na página */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funcionalidades" className="border-y border-border/40 bg-card/30">
        <div className="container py-20 lg:py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Tudo que sua oficina precisa em um só lugar
            </h2>
            <p className="text-muted-foreground">
              Funcionalidades completas para otimizar sua gestão e encantar seus clientes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-6 transition-all hover:border-primary/40 hover:bg-card hover:-translate-y-0.5"
              >
                <div className="size-12 rounded-xl bg-primary/10 grid place-items-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST + CTA */}
      <section id="recursos" className="container py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-1.5">
              Mais de 500 oficinas já confiam no MecaConnect
            </h3>
            <p className="text-muted-foreground mb-8">
              Junte-se a quem está transformando a gestão da oficina.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-4 items-center text-muted-foreground/50">
              {PARTNERS.map((p) => (
                <span key={p} className="text-xs font-bold tracking-widest">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/40 backdrop-blur p-8 lg:p-10">
            <h3 className="text-2xl font-bold tracking-tight mb-2">
              Pronto para levar sua oficina para o próximo nível?
            </h3>
            <p className="text-muted-foreground mb-6">
              Teste grátis por 15 dias. Sem compromisso.
            </p>
            <Link href="/signup">
              <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                Comece grátis agora <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contato" className="border-t border-border/40 bg-card/30">
        <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm text-muted-foreground">© 2026 MecaConnect.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Termos</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
