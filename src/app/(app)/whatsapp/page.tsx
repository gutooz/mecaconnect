import { MessageCircle, CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WhatsappConnect } from "./_components/connect";
import { WhatsappTemplates } from "./_components/templates";
import { formatDateTime } from "@/lib/utils";

export default async function WhatsappPage() {
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: templates = [] }, { data: recent = [] }, { data: queue = [] }] = await Promise.all([
    supabase.from("whatsapp_templates").select("*").eq("organization_id", organization.id),
    supabase
      .from("whatsapp_messages")
      .select("*, customer:customers(full_name)")
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("whatsapp_queue").select("*").eq("organization_id", organization.id).eq("status", "queued").limit(20),
  ]);

  return (
    <div className="container py-6 space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comunique seus clientes automaticamente. Integração via Evolution API.
        </p>
      </header>

      <WhatsappConnect organization={organization} />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Clock className="size-4" /> Fila de envio</h3>
          <Badge variant="secondary">{(queue ?? []).length} pendentes</Badge>
        </div>
        {(queue ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma mensagem na fila</p>
        ) : (
          <ul className="space-y-2">
            {(queue ?? []).map((q: any) => (
              <li key={q.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Send className="size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.phone}</p>
                  <p className="text-xs text-muted-foreground truncate">{q.message}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDateTime(q.scheduled_for)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <WhatsappTemplates templates={templates ?? []} />

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Mensagens recentes</h3>
        {(recent ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma mensagem enviada ainda</p>
        ) : (
          <ul className="divide-y">
            {(recent ?? []).map((m: any) => (
              <li key={m.id} className="flex items-start gap-3 py-3">
                <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${
                  m.status === "sent" || m.status === "delivered" || m.status === "read"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : m.status === "failed"
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {m.status === "failed" ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-between">
                    <p className="text-sm font-medium truncate">{m.customer?.full_name ?? m.phone}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(m.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
