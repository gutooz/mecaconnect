# MecaConnect

> Sistema inteligente para oficinas mecânicas — atendimento, ordens de serviço, estoque, financeiro e WhatsApp automático em um só lugar.

![Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TS](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss)

## Visão geral

MecaConnect é um SaaS multi-tenant para oficinas mecânicas modernas, com foco em **mobile-first**, **simplicidade** e **velocidade**. Estética inspirada em Apple, Stripe e Linear; UX inspirada em apps de delivery e banco digital.

### Stack

| Camada            | Tecnologia                                  |
| ----------------- | ------------------------------------------- |
| Frontend          | **Next.js 16** (App Router) + **React 19**  |
| Linguagem         | **TypeScript**                              |
| Estilo            | **TailwindCSS** + **Shadcn/UI** + Radix     |
| Backend / DB      | **Supabase** (Postgres + Auth + Storage + Realtime) |
| Estado            | React Query (TanStack)                      |
| Charts            | Recharts                                    |
| WhatsApp          | **Evolution API**                           |
| PWA               | Service Worker + Web App Manifest           |
| Hospedagem        | **Vercel** (Fluid Compute)                  |

## Estrutura

```
src/
├── app/
│   ├── (auth)/              # /login, /signup, /forgot-password
│   ├── (app)/               # área autenticada (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── clientes/
│   │   ├── veiculos/
│   │   ├── os/              # Ordens de Serviço (núcleo)
│   │   ├── orcamentos/
│   │   ├── estoque/
│   │   ├── financeiro/
│   │   ├── whatsapp/
│   │   ├── relatorios/
│   │   ├── configuracoes/
│   │   └── menu/            # bottom-nav "Mais" (mobile)
│   ├── api/
│   │   └── whatsapp/        # connect, status, webhook, process-queue
│   ├── auth/callback/       # exchange code + cria org/profile no 1º login
│   ├── os/public/[token]/   # tela pública (cliente acompanha sem login)
│   ├── orcamento/public/[token]/
│   ├── onboarding/
│   └── page.tsx             # landing
├── components/
│   ├── ui/                  # primitivos Shadcn (button, card, dialog…)
│   └── layout/              # sidebar, topbar, mobile-nav
├── lib/
│   ├── supabase/            # client (browser/server/middleware)
│   ├── actions.ts           # server actions (CRUDs principais)
│   ├── auth.ts              # getSessionData()
│   ├── evolution.ts         # cliente Evolution API
│   └── utils.ts             # cn, formatCurrency, formatPhone…
├── middleware.ts            # protege rotas + refresh de sessão
└── types/database.ts
supabase/
└── migrations/
    └── 00000000000001_initial_schema.sql   # schema completo + RLS + triggers
```

## Módulos

1. **Dashboard** — KPIs (faturamento, em serviço, OS abertas/entregues), gráfico 7 dias, top serviços, alertas de estoque baixo, OS recentes.
2. **Clientes** — Cadastro rápido, busca por nome/telefone/CPF, histórico completo, total gasto, link direto WhatsApp.
3. **Veículos** — Marca, modelo, ano, placa, KM, chassi, motor, observações, histórico de manutenção por veículo.
4. **OS (Ordens de Serviço)** — Núcleo do sistema. Cria em segundos, 7 status com timeline visual, fotos/vídeos/assinatura, PDF imprimível, link público, mensagens WhatsApp automáticas a cada mudança de status, gestão de itens (serviços/peças/mão de obra) com recálculo automático.
5. **Orçamentos** — Criação, envio, aprovação via WhatsApp, link público, conversão em OS com 1 clique.
6. **Estoque** — Cadastro de peças (SKU, código de barras, fornecedor, localização), entradas/saídas, alertas de estoque mínimo, valor total em estoque, baixa automática ao usar em OS.
7. **WhatsApp** — Conexão via QR code (Evolution API), templates editáveis para cada evento, fila de envio com retries, painel de mensagens.
8. **Financeiro** — Entradas/saídas, categorias, contas a pagar/receber, fluxo de caixa, integração com OS.
9. **Relatórios** — Faturamento, lucro, ticket médio, ranking de serviços, contagem de clientes/veículos/peças.

## Como rodar

### 1. Pré-requisitos

- Node 20+
- Conta no [Supabase](https://supabase.com)
- (Opcional) Instância [Evolution API](https://doc.evolution-api.com)

### 2. Instalar deps

```bash
npm install
```

### 3. Configurar Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase/migrations/00000000000001_initial_schema.sql`.
3. Habilite a extensão `pg_trgm` (a migration já tenta criar).
4. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Dev server

```bash
npm run dev
```

Abra http://localhost:3000.

### 5. WhatsApp (opcional)

1. Suba uma instância [Evolution API](https://github.com/EvolutionAPI/evolution-api) (Docker).
2. Adicione no `.env.local`:
   ```
   EVOLUTION_API_URL=https://sua-instancia.com
   EVOLUTION_API_KEY=sua-chave
   ```
3. No painel `/whatsapp`, clique em "Conectar WhatsApp" e escaneie o QR.
4. Configure o webhook da Evolution para apontar para:
   `https://seu-app.vercel.app/api/whatsapp/webhook`

## Deploy na Vercel

```bash
vercel
```

A configuração `vercel.ts` na raiz já registra o cron de processamento da fila WhatsApp (a cada 2 minutos).

Variáveis de ambiente necessárias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET` (para autenticar o cron)

## Segurança

- **RLS (Row Level Security)** ativado em todas as tabelas.
- Isolamento multi-tenant via função `auth_org_id()` que retorna a `organization_id` do usuário autenticado.
- Tokens públicos (OS/orçamento) usam `gen_random_bytes(16)` (128 bits, criptograficamente seguros).
- Webhook do WhatsApp valida instância contra a organização antes de gravar.

## Banco — destaques

- **Triggers automáticos**:
  - Recálculo de totais da OS e do orçamento quando itens mudam.
  - Histórico de status da OS (`service_order_status_history`).
  - Movimentação de estoque atualiza `parts.stock_quantity`.
  - Atualiza `customers.total_spent` e `last_visit_at` quando OS é entregue.
- **Enums** para todos os status (type-safe).
- **Índices** otimizados para busca por placa, telefone, low stock parcial.

## Próximos passos

- [ ] Upload de fotos da OS direto pela câmera (Storage)
- [ ] Assinatura digital com canvas
- [ ] OCR de placa via câmera
- [ ] Notificações push (PWA)
- [ ] Multi-oficina (filial)
- [ ] Permissões granulares por papel (já há `user_role` enum no banco)

## Licença

Proprietária — © 2026 MecaConnect.