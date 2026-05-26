# Arquitetura MecaConnect

## Visão de alto nível

```
┌──────────────────────────────────────────────────────────────┐
│                       Cliente (PWA)                          │
│  Next.js App Router · React 19 · Tailwind · Shadcn · Sonner  │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                  Vercel Fluid Compute                        │
│  Server Components · Server Actions · Route Handlers · Cron  │
└──────────────────────────────────────────────────────────────┘
            │                                       │
            ▼                                       ▼
   ┌─────────────────┐                    ┌─────────────────┐
   │    Supabase     │                    │ Evolution API   │
   │ Postgres + RLS  │                    │  (WhatsApp)     │
   │ Auth + Storage  │                    │                 │
   │ Realtime        │                    └─────────────────┘
   └─────────────────┘                              ▲
            ▲                                       │
            │   ┌──────────────┐                    │
            └───┤  Cron (2min) ├────────────────────┘
                │ process-queue│
                └──────────────┘
```

## Camadas

### 1. Cliente (Browser / PWA)
- Next.js App Router; Server Components por padrão para fetch direto do Supabase no servidor (sem round-trip via API).
- Client Components apenas em formulários, interações e estado local.
- Service Worker (`public/sw.js`) para cache de assets e fallback offline parcial.
- Manifest (`public/manifest.json`) com shortcuts para "Nova OS" e "Clientes".
- Layout responsivo: sidebar 256px desktop, bottom-nav 5-itens mobile (com FAB central para "Nova OS").

### 2. Server (Vercel Fluid Compute)
- **Server Components** (RSC) consomem o Supabase via `@/lib/supabase/server` que usa cookies.
- **Server Actions** (`@/lib/actions.ts`) centralizam mutations: criar cliente, criar OS, atualizar status, etc. Cada action chama `getSessionData()` para validar org/usuário e dispara `revalidatePath` quando necessário.
- **Route Handlers** apenas para integrações externas (WhatsApp connect/status/webhook/process-queue).
- **Middleware** (`src/middleware.ts`) refresca a sessão Supabase em cada request e redireciona não-autenticados para `/login`.

### 3. Banco (Supabase Postgres)
- **Multi-tenant** via coluna `organization_id` em todas as tabelas de negócio.
- **RLS** com a função `auth_org_id()` (SQL stable) — toda policy é `using (organization_id = auth_org_id())`.
- **Triggers** mantêm consistência:
  - `recalc_service_order_totals` — recalcula parts/services/labor/total quando itens mudam.
  - `recalc_quote_totals` — idem para orçamentos.
  - `apply_stock_movement` — atualiza estoque quando movimento é gravado.
  - `log_so_status_change` — grava no `service_order_status_history`.
  - `update_customer_totals` — atualiza `total_spent` e `last_visit_at`.
- **Enums** type-safe: `service_order_status`, `quote_status`, `payment_status`, `payment_method`, `transaction_type`, `whatsapp_event_type`.
- Tokens públicos seguros: `default encode(gen_random_bytes(16), 'hex')`.

### 4. Integração WhatsApp (Evolution API)
- Cada organização tem uma instância (`whatsapp_instance`).
- Fluxo de envio:
  1. Server Action (ex. `createServiceOrder`) chama `enqueueWhatsappEvent` ao final.
  2. Mensagem entra em `whatsapp_queue` (`status='queued'`).
  3. Cron Vercel a cada 2min hit `POST /api/whatsapp/process-queue`.
  4. Para cada job pendente: chama `sendText` da Evolution; em sucesso, marca `sent` e grava em `whatsapp_messages`. Em falha, retenta até `max_attempts`.
- Webhook (`/api/whatsapp/webhook`) recebe `messages.upsert` (entrada) e `messages.update` (status de entrega/leitura).

## Decisões importantes

- **Por que Server Actions e não tRPC/REST?** Para reduzir boilerplate. O Next 16 App Router torna server actions de primeira classe; com Supabase + RLS já temos validação na camada do banco. tRPC seria overkill para um SaaS deste porte.
- **Por que Evolution API e não API oficial do WhatsApp?** Custo zero, suporte a recursos não-oficiais e instalação self-hosted. Para oficinas pequenas/médias é o caminho mais pragmático. Se o cliente precisar de oficial, basta plugar Cloud API neste mesmo `enqueueWhatsappEvent`.
- **Por que multi-tenant em um único banco?** Simplicidade operacional. Quando passar de ~1000 organizações grandes, considerar isolamento por schema ou shard.
- **Por que tokens públicos hex de 16 bytes (32 hex chars)?** 128 bits criptograficamente seguros, mais legíveis que UUIDs e curtos o suficiente para QR codes/URLs.

## Convenções

- **Pastas em português** (clientes, veiculos, os, orcamentos…) — usuário do código entende imediatamente o que cada rota é.
- **Variáveis em inglês** no banco (`customers`, `service_orders`) — padrão internacional para SQL.
- **Server Components by default**; client component apenas com `"use client"` quando precisa de hooks/eventos.
- **Formatação de moeda/data sempre via `@/lib/utils`** — `formatCurrency(123)` → `"R$ 123,00"`, nunca inline.

## Roadmap técnico

- **Storage**: pasta `os-photos/{org_id}/{os_id}/{uuid}.jpg` com policies que herdam de `service_orders`.
- **Realtime**: subscribir mudanças de `service_orders` no dashboard para atualizar status sem F5.
- **Offline**: ampliar SW para cache de OS abertas e fila de mutations.
- **Permissões granulares**: usar a coluna `role` + `permissions jsonb` para RBAC por módulo.
