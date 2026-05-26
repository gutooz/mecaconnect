"use client";

import * as React from "react";
import { Send, Wrench, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendQuote, convertQuoteToOS } from "@/lib/actions";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/types/database";

export function QuoteActions({ id, status, waLink }: { id: string; status: QuoteStatus; waLink: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onSend() {
    setPending(true);
    try {
      await sendQuote(id);
      toast.success("Orçamento marcado como enviado");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function onConvert() {
    if (!confirm("Converter este orçamento em OS?")) return;
    setPending(true);
    try {
      const os = await convertQuoteToOS(id);
      toast.success("OS criada!");
      router.push(`/os/${os.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={waLink} target="_blank" rel="noreferrer">
        <Button variant="outline"><MessageCircle /> WhatsApp</Button>
      </a>
      {status === "draft" && (
        <Button onClick={onSend} loading={pending}><Send /> Marcar como enviado</Button>
      )}
      {(status === "approved" || status === "sent") && (
        <Button variant="gradient" onClick={onConvert} loading={pending}><Wrench /> Converter em OS</Button>
      )}
    </div>
  );
}
