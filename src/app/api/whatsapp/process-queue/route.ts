import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendText } from "@/lib/evolution";

// POST /api/whatsapp/process-queue
// Processa a fila de mensagens pendentes — pode ser chamado por cron Vercel
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET ?? "dev"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await createAdminClient();
  const { data: jobs = [] } = await admin
    .from("whatsapp_queue")
    .select("*, organization:organizations(whatsapp_instance, whatsapp_connected)")
    .eq("status", "queued")
    .lte("scheduled_for", new Date().toISOString())
    .limit(20);

  const results: any[] = [];
  for (const job of jobs ?? []) {
    const org = (job as any).organization;
    if (!org?.whatsapp_connected || !org.whatsapp_instance) {
      await admin.from("whatsapp_queue").update({ status: "failed", last_error: "WhatsApp não conectado" }).eq("id", job.id);
      continue;
    }

    try {
      await admin.from("whatsapp_queue").update({ status: "processing", attempts: job.attempts + 1 }).eq("id", job.id);
      const r = await sendText({
        instance: org.whatsapp_instance,
        phone: job.phone,
        text: job.message,
      });

      await admin.from("whatsapp_messages").insert({
        organization_id: job.organization_id,
        customer_id: job.customer_id,
        phone: job.phone,
        direction: "outbound",
        message: job.message,
        event_type: job.event_type,
        service_order_id: job.service_order_id,
        quote_id: job.quote_id,
        external_id: r.key?.id,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      await admin.from("whatsapp_queue").update({ status: "sent" }).eq("id", job.id);
      results.push({ id: job.id, ok: true });
    } catch (err) {
      const message = (err as Error).message;
      const failed = job.attempts + 1 >= job.max_attempts;
      await admin.from("whatsapp_queue").update({
        status: failed ? "failed" : "queued",
        last_error: message,
      }).eq("id", job.id);
      results.push({ id: job.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
