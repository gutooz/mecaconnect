"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { bootstrapOrganization } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name"));

    try {
      await bootstrapOrganization(name);
      toast.success("Oficina criada!");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-1">Quase lá!</h1>
          <p className="text-sm text-muted-foreground mb-6">Dê um nome à sua oficina para começar.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da oficina</Label>
              <Input id="name" name="name" icon={<Building2 />} required placeholder="Auto Center Silva" />
            </div>
            <Button type="submit" variant="gradient" size="lg" className="w-full" loading={loading}>
              Criar oficina <ArrowRight className="size-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
