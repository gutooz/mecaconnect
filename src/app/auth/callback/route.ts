import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=auth_callback`);

  // Cria organização + profile se ainda não existe
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = await createAdminClient();
    const { data: existing } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!existing) {
      const fullName = (user.user_metadata?.full_name as string) ?? user.email ?? "Usuário";
      const orgName = (user.user_metadata?.organization_name as string) ?? `Oficina de ${fullName}`;
      const baseSlug = slugify(orgName);
      const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: org } = await admin
        .from("organizations")
        .insert({ name: orgName, slug })
        .select("id")
        .single();

      if (org) {
        await admin.from("profiles").insert({
          id: user.id,
          organization_id: org.id,
          full_name: fullName,
          email: user.email!,
          role: "owner",
        });

        // Seeds: categorias financeiras + templates whatsapp padrão
        await admin.from("financial_categories").insert([
          { organization_id: org.id, name: "Mão de obra", type: "income", color: "#22c55e" },
          { organization_id: org.id, name: "Peças", type: "income", color: "#3b82f6" },
          { organization_id: org.id, name: "Fornecedores", type: "expense", color: "#f97316" },
          { organization_id: org.id, name: "Aluguel", type: "expense", color: "#ef4444" },
          { organization_id: org.id, name: "Salários", type: "expense", color: "#a855f7" },
        ]);

        await admin.from("whatsapp_templates").insert([
          {
            organization_id: org.id,
            event_type: "os_created",
            name: "OS Criada",
            message_template:
              "Olá {{cliente}}! Recebemos seu veículo {{veiculo}}. OS #{{numero}} criada. Acompanhe em: {{link}}",
          },
          {
            organization_id: org.id,
            event_type: "vehicle_ready",
            name: "Veículo Pronto",
            message_template:
              "Olá {{cliente}}! Seu {{veiculo}} está pronto para retirada. Total: {{total}}. OS #{{numero}}",
          },
          {
            organization_id: org.id,
            event_type: "quote_sent",
            name: "Orçamento Enviado",
            message_template:
              "Olá {{cliente}}! Seu orçamento #{{numero}} no valor de {{total}} está disponível: {{link}}",
          },
          {
            organization_id: org.id,
            event_type: "payment_reminder",
            name: "Lembrete de Pagamento",
            message_template:
              "Olá {{cliente}}, lembramos que o pagamento de {{valor}} vence em {{data}}.",
          },
          {
            organization_id: org.id,
            event_type: "satisfaction_survey",
            name: "Pesquisa de Satisfação",
            message_template:
              "Olá {{cliente}}, como foi sua experiência conosco? Avalie de 1 a 5: {{link}}",
          },
        ]);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
