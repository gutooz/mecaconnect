import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { createInstance, getQrCode } from "@/lib/evolution";

export async function POST() {
  const { organization } = await getSessionData();
  const supabase = await createClient();
  const instance = organization.whatsapp_instance ?? `org-${organization.id.slice(0, 8)}`;

  try {
    await createInstance(instance).catch(() => null); // ignora se já existe
    const qrData = await getQrCode(instance);

    await supabase
      .from("organizations")
      .update({ whatsapp_instance: instance })
      .eq("id", organization.id);

    return NextResponse.json({
      instance,
      qr: qrData.base64 ? `data:image/png;base64,${qrData.base64}` : null,
      code: qrData.code,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
