"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { WhatsappEventType } from "@/types/database";

const EVENT_LABELS: Record<WhatsappEventType, string> = {
  os_created: "OS criada",
  os_status_changed: "Status da OS alterado",
  vehicle_ready: "Veículo pronto",
  quote_sent: "Orçamento enviado",
  quote_approval_pending: "Aprovação pendente",
  payment_reminder: "Lembrete de pagamento",
  service_reminder: "Lembrete de revisão",
  satisfaction_survey: "Pesquisa de satisfação",
};

const VARIABLES = ["{{cliente}}", "{{numero}}", "{{veiculo}}", "{{total}}", "{{link}}", "{{data}}"];

export function WhatsappTemplates({ templates }: { templates: any[] }) {
  const [editing, setEditing] = React.useState<Record<string, string>>(
    Object.fromEntries(templates.map((t) => [t.event_type, t.message_template])),
  );
  const [savingId, setSavingId] = React.useState<string | null>(null);

  async function save(t: any) {
    setSavingId(t.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("whatsapp_templates")
      .update({ message_template: editing[t.event_type] })
      .eq("id", t.id);
    if (error) toast.error(error.message);
    else toast.success("Template salvo!");
    setSavingId(null);
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-1">Templates de mensagens</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Variáveis disponíveis: {VARIABLES.map((v) => <code key={v} className="bg-muted px-1.5 py-0.5 rounded text-[10px] mx-0.5">{v}</code>)}
      </p>

      <div className="space-y-5">
        {templates.map((t) => (
          <div key={t.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" />
              {EVENT_LABELS[t.event_type as WhatsappEventType]}
            </Label>
            <Textarea
              value={editing[t.event_type] ?? t.message_template}
              onChange={(e) => setEditing((s) => ({ ...s, [t.event_type]: e.target.value }))}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => save(t)}
                loading={savingId === t.id}
                disabled={editing[t.event_type] === t.message_template}
              >
                <Save /> Salvar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
