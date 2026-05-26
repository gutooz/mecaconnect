"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { slugify } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    fullName: "",
    orgName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = React.useState(false);

  function update(k: keyof typeof form, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            organization_name: form.orgName,
            organization_slug: slugify(form.orgName),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      toast.success("Conta criada! Verifique seu email para confirmar.");
      if (data.session) router.push("/dashboard");
      else router.push("/login");
    } catch (err) {
      toast.error("Erro ao criar conta", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="flex justify-center mb-8">
        <Logo href="/" size="lg" priority />
      </div>

      <Card className="shadow-xl border-border/50 backdrop-blur-xl bg-card/90">
        <CardHeader>
          <CardTitle className="text-2xl">Comece sua oficina digital</CardTitle>
          <CardDescription>Crie sua conta em menos de 1 minuto. Sem cartão de crédito.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Seu nome</Label>
              <Input
                id="fullName"
                icon={<User />}
                placeholder="Carlos Silva"
                required
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgName">Nome da oficina</Label>
              <Input
                id="orgName"
                icon={<Building2 />}
                placeholder="Auto Center Silva"
                required
                value={form.orgName}
                onChange={(e) => update("orgName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                icon={<Mail />}
                placeholder="voce@oficina.com"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                icon={<Lock />}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
              Criar minha oficina
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
