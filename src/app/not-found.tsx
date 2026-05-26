import Link from "next/link";
import { Wrench, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto size-14 rounded-2xl gradient-brand grid place-items-center shadow-xl mb-6">
          <Wrench className="size-6 text-white" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight">404</h1>
        <p className="mt-3 text-lg text-muted-foreground">Esta página deu pane no motor.</p>
        <p className="text-sm text-muted-foreground">Verifique o endereço ou volte ao painel.</p>
        <Link href="/dashboard" className="inline-block mt-8">
          <Button variant="gradient" size="lg"><Home /> Voltar ao painel</Button>
        </Link>
      </div>
    </div>
  );
}
