"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { Customer, ServiceOrder, Vehicle } from "@/types/database";

// ============== ONBOARDING ==============

export async function bootstrapOrganization(orgName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const admin = await createAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing?.organization_id) {
    return { organization_id: existing.organization_id };
  }

  const slug = `${slugify(orgName)}-${user.id.slice(0, 6)}`;
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name: orgName, slug })
    .select("id")
    .single();
  if (orgErr || !org) throw new Error(orgErr?.message ?? "Falha ao criar oficina");

  const fullName = (user.user_metadata?.full_name as string) ?? user.email ?? "Usuário";
  const { error: profErr } = await admin.from("profiles").upsert({
    id: user.id,
    organization_id: org.id,
    full_name: fullName,
    email: user.email!,
    role: "owner",
  });
  if (profErr) throw new Error(profErr.message);

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

  return { organization_id: org.id };
}

// ============== CLIENTES ==============

export async function createCustomer(input: {
  full_name: string;
  phone: string;
  email?: string;
  document?: string;
  notes?: string;
  address_street?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}) {
  const { organization } = await getSessionData();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...input, organization_id: organization.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
  return data;
}

export async function updateCustomer(id: string, patch: Partial<Customer>) {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/clientes");
}

// ============== VEÍCULOS ==============

export async function createVehicle(input: {
  customer_id: string;
  brand: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
  current_km?: number;
  chassis?: string;
  engine?: string;
  fuel_type?: string;
  notes?: string;
}) {
  const { organization } = await getSessionData();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...input, organization_id: organization.id, plate: input.plate.toUpperCase() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/veiculos");
  revalidatePath(`/clientes/${input.customer_id}`);
  return data;
}

export async function updateVehicle(id: string, patch: Partial<Vehicle>) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/veiculos/${id}`);
  revalidatePath("/veiculos");
}

// ============== ORDENS DE SERVIÇO ==============

export async function createServiceOrder(input: {
  customer_id: string;
  vehicle_id: string;
  reported_problem?: string;
  current_km?: number;
  fuel_level?: string;
  expected_delivery_at?: string;
}) {
  const { organization, user } = await getSessionData();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_orders")
    .insert({
      ...input,
      organization_id: organization.id,
      created_by: user.id,
      status: "received",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Enfileira notificação WhatsApp
  if (data) {
    await enqueueWhatsappEvent({
      event_type: "os_created",
      service_order_id: data.id,
      customer_id: input.customer_id,
    });
  }
  revalidatePath("/os");
  revalidatePath("/dashboard");
  return data;
}

export async function updateServiceOrderStatus(id: string, status: string) {
  const supabase = await createClient();
  const patch: Partial<ServiceOrder> = { status: status as ServiceOrder["status"] };
  const now = new Date().toISOString();
  if (status === "in_progress") patch.started_at = now;
  if (status === "completed") patch.completed_at = now;
  if (status === "delivered") patch.delivered_at = now;

  const { data, error } = await supabase
    .from("service_orders")
    .update(patch)
    .eq("id", id)
    .select("id, customer_id, status")
    .single();
  if (error) throw new Error(error.message);

  if (data && (status === "completed" || status === "delivered")) {
    await enqueueWhatsappEvent({
      event_type: "vehicle_ready",
      service_order_id: id,
      customer_id: data.customer_id,
    });
  } else if (data) {
    await enqueueWhatsappEvent({
      event_type: "os_status_changed",
      service_order_id: id,
      customer_id: data.customer_id,
    });
  }

  revalidatePath(`/os/${id}`);
  revalidatePath("/os");
  revalidatePath("/dashboard");
}

export async function addServiceOrderItem(input: {
  service_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  item_type: "service" | "part" | "labor" | "other";
  service_id?: string;
  part_id?: string;
}) {
  const supabase = await createClient();
  const total = input.quantity * input.unit_price;
  const { error } = await supabase.from("service_order_items").insert({ ...input, total });
  if (error) throw new Error(error.message);

  // Se for peça, baixa do estoque
  if (input.part_id && input.item_type === "part") {
    const { organization } = await getSessionData();
    await supabase.from("stock_movements").insert({
      organization_id: organization.id,
      part_id: input.part_id,
      type: "used_in_service",
      quantity: input.quantity,
      reference_id: input.service_order_id,
      reason: "Utilizado em OS",
    });
  }

  revalidatePath(`/os/${input.service_order_id}`);
}

export async function removeServiceOrderItem(id: string, serviceOrderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("service_order_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/os/${serviceOrderId}`);
}

// ============== ORÇAMENTOS ==============

export async function createQuote(input: {
  customer_id: string;
  vehicle_id?: string;
  valid_until?: string;
  notes?: string;
}) {
  const { organization, user } = await getSessionData();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      ...input,
      organization_id: organization.id,
      created_by: user.id,
      status: "draft",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/orcamentos");
  return data;
}

export async function sendQuote(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .update({ status: "sent" })
    .eq("id", id)
    .select("id, customer_id")
    .single();
  if (error) throw new Error(error.message);

  if (data) {
    await enqueueWhatsappEvent({
      event_type: "quote_sent",
      quote_id: id,
      customer_id: data.customer_id,
    });
  }
  revalidatePath(`/orcamentos/${id}`);
}

export async function convertQuoteToOS(quoteId: string) {
  const { organization, user } = await getSessionData();
  const supabase = await createClient();

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", quoteId)
    .single();
  if (qErr || !quote) throw new Error(qErr?.message ?? "Orçamento não encontrado");
  if (!quote.vehicle_id) throw new Error("Orçamento sem veículo");

  const { data: os, error: osErr } = await supabase
    .from("service_orders")
    .insert({
      organization_id: organization.id,
      customer_id: quote.customer_id,
      vehicle_id: quote.vehicle_id,
      status: "received",
      created_by: user.id,
      discount: quote.discount,
      tax: quote.tax,
    })
    .select()
    .single();
  if (osErr || !os) throw new Error(osErr?.message);

  // Copia itens
  const items = (quote.items as any[]).map((it) => ({
    service_order_id: os.id,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    discount: it.discount,
    total: it.total,
    item_type: it.item_type,
    service_id: it.service_id,
    part_id: it.part_id,
  }));
  if (items.length) await supabase.from("service_order_items").insert(items);

  await supabase
    .from("quotes")
    .update({ status: "converted", converted_service_order_id: os.id })
    .eq("id", quoteId);

  revalidatePath("/os");
  revalidatePath("/orcamentos");
  return os;
}

// ============== ESTOQUE ==============

export async function createPart(input: {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  cost_price?: number;
  sale_price: number;
  stock_quantity?: number;
  min_stock?: number;
  supplier_id?: string;
  location?: string;
}) {
  const { organization } = await getSessionData();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts")
    .insert({ ...input, organization_id: organization.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/estoque");
  return data;
}

export async function addStockMovement(input: {
  part_id: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  unit_cost?: number;
  reason?: string;
}) {
  const { organization, user } = await getSessionData();
  const supabase = await createClient();
  const { error } = await supabase.from("stock_movements").insert({
    ...input,
    organization_id: organization.id,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/estoque");
}

// ============== FINANCEIRO ==============

export async function createTransaction(input: {
  type: "income" | "expense";
  description: string;
  amount: number;
  due_date?: string;
  payment_status?: "pending" | "paid";
  payment_method?: string;
  category_id?: string;
  service_order_id?: string;
}) {
  const { organization, user } = await getSessionData();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_transactions")
    .insert({
      ...input,
      organization_id: organization.id,
      created_by: user.id,
      payment_status: input.payment_status ?? "pending",
      paid_at: input.payment_status === "paid" ? new Date().toISOString() : null,
    } as any)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/financeiro");
  return data;
}

export async function markTransactionPaid(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("financial_transactions")
    .update({ payment_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/financeiro");
}

// ============== WHATSAPP ==============

export async function enqueueWhatsappEvent(input: {
  event_type: string;
  service_order_id?: string;
  quote_id?: string;
  customer_id: string;
}) {
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: customer }, { data: template }] = await Promise.all([
    supabase.from("customers").select("phone, full_name").eq("id", input.customer_id).single(),
    supabase
      .from("whatsapp_templates")
      .select("message_template")
      .eq("organization_id", organization.id)
      .eq("event_type", input.event_type as any)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!customer || !template) return;

  let message = template.message_template.replace("{{cliente}}", customer.full_name);
  if (input.service_order_id) {
    const { data: os } = await supabase
      .from("service_orders")
      .select("number, total, public_token, vehicle:vehicles(brand, model, plate)")
      .eq("id", input.service_order_id)
      .single();
    if (os) {
      const v = (os as any).vehicle;
      message = message
        .replace("{{numero}}", String(os.number))
        .replace("{{total}}", `R$ ${Number(os.total).toFixed(2)}`)
        .replace("{{veiculo}}", `${v?.brand} ${v?.model} (${v?.plate})`)
        .replace("{{link}}", `${process.env.NEXT_PUBLIC_APP_URL}/os/public/${os.public_token}`);
    }
  }

  await supabase.from("whatsapp_queue").insert({
    organization_id: organization.id,
    customer_id: input.customer_id,
    phone: customer.phone,
    message,
    event_type: input.event_type as any,
    service_order_id: input.service_order_id,
    quote_id: input.quote_id,
  });
}
