import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { WhatsappMessage } from "@/types/database";

// Recebe eventos do Evolution API (mensagens recebidas, status de entrega, etc).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const admin = await createAdminClient();

  const event = body?.event;
  const data = body?.data;
  if (!event || !data) return NextResponse.json({ ok: true });

  if (event === "messages.upsert" && data?.key?.fromMe === false) {
    const phone = String(data.key?.remoteJid ?? "").replace(/@.*/, "");
    const text =
      data.message?.conversation ?? data.message?.extendedTextMessage?.text ?? "[mídia]";
    const instanceName = body?.instance;

    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("whatsapp_instance", instanceName)
      .maybeSingle();
    if (!org) return NextResponse.json({ ok: true });

    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("organization_id", org.id)
      .ilike("phone", `%${phone.slice(-8)}%`)
      .maybeSingle();

    await admin.from("whatsapp_messages").insert({
      organization_id: org.id,
      customer_id: customer?.id,
      phone,
      direction: "inbound",
      message: text,
      external_id: data.key?.id,
      status: "delivered",
    });
  }

  if (event === "messages.update") {
    const id = data?.key?.id;
    const status = data?.status?.toLowerCase();
    if (id && status) {
      const patch: Partial<WhatsappMessage> = { status };
      if (status === "delivered") patch.delivered_at = new Date().toISOString();
      if (status === "read") patch.read_at = new Date().toISOString();
      await admin.from("whatsapp_messages").update(patch).eq("external_id", id);
    }
  }

  return NextResponse.json({ ok: true });
}
