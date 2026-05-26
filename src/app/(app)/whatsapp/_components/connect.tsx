"use client";

import * as React from "react";
import { MessageCircle, QrCode, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Organization } from "@/types/database";

export function WhatsappConnect({ organization }: { organization: Organization }) {
  const [qr, setQr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [connected, setConnected] = React.useState(organization.whatsapp_connected);

  async function onConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao conectar");
      const data = await res.json();
      setQr(data.qr ?? null);
      toast.success("Escaneie o QR code no WhatsApp");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setConnected(data.connected);
      if (data.connected) {
        setQr(null);
        toast.success("WhatsApp conectado!");
      }
    } catch {
      // silent
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className={`size-12 rounded-2xl grid place-items-center ${connected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
          <MessageCircle className="size-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Conexão WhatsApp</h3>
            {connected ? (
              <Badge variant="success"><CheckCircle2 className="size-3" /> Conectado</Badge>
            ) : (
              <Badge variant="muted">Desconectado</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {connected
              ? "Mensagens automáticas estão ativas para seus clientes."
              : "Conecte seu WhatsApp para começar a enviar mensagens automáticas."}
          </p>

          {qr && (
            <div className="mt-4 p-4 bg-white rounded-xl inline-block">
              <img src={qr} alt="QR Code" className="size-48" />
              <p className="text-xs text-center mt-2 text-black">
                Abra o WhatsApp · Dispositivos conectados
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {!connected && (
              <Button onClick={onConnect} loading={loading} variant="gradient">
                <QrCode /> {qr ? "Gerar novo QR" : "Conectar WhatsApp"}
              </Button>
            )}
            <Button variant="outline" onClick={checkStatus}>
              <RefreshCw /> Verificar status
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
