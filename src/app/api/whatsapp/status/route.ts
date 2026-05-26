import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { getInstanceStatus } from "@/lib/evolution";

export async function GET() {
  const { organization } = await getSessionData();
  if (!organization.whatsapp_instance) {
    return NextResponse.json({ connected: false });
  }
  try {
    const s = await getInstanceStatus(organization.whatsapp_instance);
    const connected = s.state === "open";
    if (connected !== organization.whatsapp_connected) {
      const supabase = await createClient();
      await supabase.from("organizations").update({ whatsapp_connected: connected }).eq("id", organization.id);
    }
    return NextResponse.json({ connected, state: s.state });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
