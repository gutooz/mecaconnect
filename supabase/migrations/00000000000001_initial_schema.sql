-- =====================================================
-- MecaConnect — Schema Inicial
-- SaaS para Oficinas Mecânicas
-- =====================================================

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- =====================================================
-- ENUMS
-- =====================================================

create type user_role as enum ('owner', 'admin', 'manager', 'mechanic', 'attendant');
create type service_order_status as enum (
  'received', 'analyzing', 'awaiting_approval', 'in_progress', 'completed', 'delivered', 'canceled'
);
create type quote_status as enum ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted');
create type payment_status as enum ('pending', 'partial', 'paid', 'overdue', 'canceled');
create type payment_method as enum ('cash', 'pix', 'debit_card', 'credit_card', 'bank_transfer', 'check', 'other');
create type transaction_type as enum ('income', 'expense');
create type stock_movement_type as enum ('in', 'out', 'adjustment', 'used_in_service');
create type whatsapp_event_type as enum (
  'os_created', 'os_status_changed', 'vehicle_ready', 'quote_sent',
  'quote_approval_pending', 'payment_reminder', 'service_reminder', 'satisfaction_survey'
);

-- =====================================================
-- ORGANIZAÇÕES (multi-tenant)
-- =====================================================

create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  cnpj text,
  phone text,
  email text,
  address text,
  logo_url text,
  primary_color text default '#2563ff',
  whatsapp_instance text,
  whatsapp_connected boolean default false,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_organizations_slug on organizations(slug);

-- =====================================================
-- PROFILES (usuários ligados a org)
-- =====================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role user_role not null default 'attendant',
  permissions jsonb default '{}'::jsonb,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_organization on profiles(organization_id);

-- =====================================================
-- CLIENTES
-- =====================================================

create table customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  document text, -- CPF/CNPJ
  birth_date date,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zip text,
  notes text,
  tags text[] default array[]::text[],
  total_spent numeric(12,2) default 0,
  last_visit_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_customers_org on customers(organization_id);
create index idx_customers_phone on customers(organization_id, phone);
create index idx_customers_document on customers(organization_id, document);
create index idx_customers_name_trgm on customers using gin (full_name extensions.gin_trgm_ops);

-- =====================================================
-- VEÍCULOS
-- =====================================================

create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  brand text not null,
  model text not null,
  year int,
  plate text not null,
  color text,
  current_km int default 0,
  chassis text,
  engine text,
  fuel_type text,
  notes text,
  photos text[] default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_vehicles_org on vehicles(organization_id);
create index idx_vehicles_customer on vehicles(customer_id);
create index idx_vehicles_plate on vehicles(organization_id, plate);

-- =====================================================
-- SERVIÇOS (catálogo)
-- =====================================================

create table services (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  default_price numeric(12,2) not null default 0,
  estimated_duration_minutes int,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_services_org on services(organization_id);

-- =====================================================
-- PEÇAS / ESTOQUE
-- =====================================================

create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  cnpj text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

create table parts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sku text,
  barcode text,
  name text not null,
  description text,
  category text,
  supplier_id uuid references suppliers(id) on delete set null,
  cost_price numeric(12,2) default 0,
  sale_price numeric(12,2) not null default 0,
  stock_quantity int default 0,
  min_stock int default 0,
  location text,
  image_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_parts_org on parts(organization_id);
create index idx_parts_sku on parts(organization_id, sku);
create index idx_parts_barcode on parts(organization_id, barcode);
create index idx_parts_low_stock on parts(organization_id) where stock_quantity <= min_stock;

create table stock_movements (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  part_id uuid not null references parts(id) on delete cascade,
  type stock_movement_type not null,
  quantity int not null,
  unit_cost numeric(12,2),
  reason text,
  reference_id uuid, -- pode referenciar OS
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index idx_movements_org on stock_movements(organization_id);
create index idx_movements_part on stock_movements(part_id);

-- =====================================================
-- ORDENS DE SERVIÇO
-- =====================================================

create table service_orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  number serial,
  customer_id uuid not null references customers(id) on delete restrict,
  vehicle_id uuid not null references vehicles(id) on delete restrict,
  assigned_mechanic_id uuid references profiles(id) on delete set null,
  status service_order_status not null default 'received',
  reported_problem text,
  diagnosis text,
  internal_notes text,
  current_km int,
  fuel_level text,
  photos text[] default array[]::text[],
  videos text[] default array[]::text[],
  checklist jsonb default '{}'::jsonb,
  customer_signature text, -- base64 ou URL
  mechanic_signature text,
  public_token text unique default encode(gen_random_bytes(16), 'hex'),
  labor_total numeric(12,2) default 0,
  parts_total numeric(12,2) default 0,
  services_total numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  expected_delivery_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  delivered_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_so_org on service_orders(organization_id);
create index idx_so_customer on service_orders(customer_id);
create index idx_so_vehicle on service_orders(vehicle_id);
create index idx_so_status on service_orders(organization_id, status);
create index idx_so_number on service_orders(organization_id, number);
create unique index idx_so_public_token on service_orders(public_token);

create table service_order_items (
  id uuid primary key default uuid_generate_v4(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  part_id uuid references parts(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) default 0,
  total numeric(12,2) not null default 0,
  item_type text not null check (item_type in ('service','part','labor','other')),
  created_at timestamptz default now()
);

create index idx_soi_so on service_order_items(service_order_id);

create table service_order_status_history (
  id uuid primary key default uuid_generate_v4(),
  service_order_id uuid not null references service_orders(id) on delete cascade,
  from_status service_order_status,
  to_status service_order_status not null,
  notes text,
  changed_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index idx_so_history on service_order_status_history(service_order_id);

-- =====================================================
-- ORÇAMENTOS
-- =====================================================

create table quotes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  number serial,
  customer_id uuid not null references customers(id) on delete restrict,
  vehicle_id uuid references vehicles(id) on delete set null,
  status quote_status not null default 'draft',
  valid_until date,
  notes text,
  internal_notes text,
  public_token text unique default encode(gen_random_bytes(16), 'hex'),
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) default 0,
  approved_at timestamptz,
  approved_signature text,
  converted_service_order_id uuid references service_orders(id) on delete set null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_quotes_org on quotes(organization_id);
create index idx_quotes_customer on quotes(customer_id);
create unique index idx_quotes_public_token on quotes(public_token);

create table quote_items (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references quotes(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  part_id uuid references parts(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount numeric(12,2) default 0,
  total numeric(12,2) not null default 0,
  item_type text not null check (item_type in ('service','part','labor','other')),
  created_at timestamptz default now()
);

create index idx_qi_quote on quote_items(quote_id);

-- =====================================================
-- FINANCEIRO
-- =====================================================

create table financial_categories (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type transaction_type not null,
  color text default '#64748b',
  created_at timestamptz default now()
);

create table financial_transactions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type transaction_type not null,
  category_id uuid references financial_categories(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null,
  payment_method payment_method,
  payment_status payment_status not null default 'pending',
  due_date date,
  paid_at timestamptz,
  service_order_id uuid references service_orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  notes text,
  attachments text[] default array[]::text[],
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_ft_org on financial_transactions(organization_id);
create index idx_ft_status on financial_transactions(organization_id, payment_status);
create index idx_ft_due on financial_transactions(organization_id, due_date);
create index idx_ft_so on financial_transactions(service_order_id);

-- =====================================================
-- WHATSAPP / COMUNICAÇÃO
-- =====================================================

create table whatsapp_templates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_type whatsapp_event_type not null,
  name text not null,
  message_template text not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_wt_event on whatsapp_templates(organization_id, event_type) where active = true;

create table whatsapp_messages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  phone text not null,
  direction text not null check (direction in ('inbound','outbound')),
  event_type whatsapp_event_type,
  message text not null,
  media_url text,
  external_id text,
  status text default 'pending', -- pending, sent, delivered, read, failed
  service_order_id uuid references service_orders(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_wm_org on whatsapp_messages(organization_id);
create index idx_wm_phone on whatsapp_messages(organization_id, phone);
create index idx_wm_status on whatsapp_messages(organization_id, status);

create table whatsapp_queue (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id),
  phone text not null,
  message text not null,
  media_url text,
  event_type whatsapp_event_type,
  service_order_id uuid references service_orders(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  scheduled_for timestamptz default now(),
  attempts int default 0,
  max_attempts int default 3,
  status text default 'queued' check (status in ('queued','processing','sent','failed')),
  last_error text,
  created_at timestamptz default now()
);

create index idx_wq_status on whatsapp_queue(organization_id, status, scheduled_for);

-- =====================================================
-- NOTIFICAÇÕES (in-app)
-- =====================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info',
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

create index idx_notif_user on notifications(user_id, read, created_at desc);

-- =====================================================
-- AUDIT LOG
-- =====================================================

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_audit_org on audit_logs(organization_id, created_at desc);

-- =====================================================
-- TRIGGERS / FUNÇÕES
-- =====================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_organizations_updated before update on organizations
  for each row execute function set_updated_at();
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_customers_updated before update on customers
  for each row execute function set_updated_at();
create trigger trg_vehicles_updated before update on vehicles
  for each row execute function set_updated_at();
create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();
create trigger trg_parts_updated before update on parts
  for each row execute function set_updated_at();
create trigger trg_so_updated before update on service_orders
  for each row execute function set_updated_at();
create trigger trg_quotes_updated before update on quotes
  for each row execute function set_updated_at();
create trigger trg_ft_updated before update on financial_transactions
  for each row execute function set_updated_at();
create trigger trg_wt_updated before update on whatsapp_templates
  for each row execute function set_updated_at();

-- Recalcula totais da OS
create or replace function recalc_service_order_totals()
returns trigger language plpgsql as $$
declare
  v_so_id uuid;
  v_parts numeric(12,2);
  v_services numeric(12,2);
  v_labor numeric(12,2);
begin
  v_so_id := coalesce(new.service_order_id, old.service_order_id);
  select
    coalesce(sum(case when item_type = 'part' then total else 0 end), 0),
    coalesce(sum(case when item_type = 'service' then total else 0 end), 0),
    coalesce(sum(case when item_type = 'labor' then total else 0 end), 0)
  into v_parts, v_services, v_labor
  from service_order_items where service_order_id = v_so_id;

  update service_orders set
    parts_total = v_parts,
    services_total = v_services,
    labor_total = v_labor,
    total = greatest(0, v_parts + v_services + v_labor - coalesce(discount,0) + coalesce(tax,0))
  where id = v_so_id;
  return new;
end; $$;

create trigger trg_soi_recalc after insert or update or delete on service_order_items
  for each row execute function recalc_service_order_totals();

-- Recalcula totais do orçamento
create or replace function recalc_quote_totals()
returns trigger language plpgsql as $$
declare
  v_q_id uuid;
  v_sub numeric(12,2);
begin
  v_q_id := coalesce(new.quote_id, old.quote_id);
  select coalesce(sum(total), 0) into v_sub
  from quote_items where quote_id = v_q_id;

  update quotes set
    subtotal = v_sub,
    total = greatest(0, v_sub - coalesce(discount,0) + coalesce(tax,0))
  where id = v_q_id;
  return new;
end; $$;

create trigger trg_qi_recalc after insert or update or delete on quote_items
  for each row execute function recalc_quote_totals();

-- Movimentação de estoque atualiza quantidade
create or replace function apply_stock_movement()
returns trigger language plpgsql as $$
begin
  if new.type = 'in' then
    update parts set stock_quantity = stock_quantity + new.quantity where id = new.part_id;
  elsif new.type in ('out', 'used_in_service') then
    update parts set stock_quantity = stock_quantity - new.quantity where id = new.part_id;
  elsif new.type = 'adjustment' then
    update parts set stock_quantity = new.quantity where id = new.part_id;
  end if;
  return new;
end; $$;

create trigger trg_stock_mov after insert on stock_movements
  for each row execute function apply_stock_movement();

-- Histórico automático de status da OS
create or replace function log_so_status_change()
returns trigger language plpgsql as $$
begin
  if old.status is distinct from new.status then
    insert into service_order_status_history (service_order_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  return new;
end; $$;

create trigger trg_so_status_history after update of status on service_orders
  for each row execute function log_so_status_change();

-- Atualiza total gasto do cliente
create or replace function update_customer_totals()
returns trigger language plpgsql as $$
begin
  update customers set
    total_spent = (
      select coalesce(sum(total), 0)
      from service_orders
      where customer_id = new.customer_id and status = 'delivered'
    ),
    last_visit_at = (
      select max(coalesce(delivered_at, created_at))
      from service_orders where customer_id = new.customer_id
    )
  where id = new.customer_id;
  return new;
end; $$;

create trigger trg_so_customer_totals after insert or update on service_orders
  for each row execute function update_customer_totals();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table services enable row level security;
alter table suppliers enable row level security;
alter table parts enable row level security;
alter table stock_movements enable row level security;
alter table service_orders enable row level security;
alter table service_order_items enable row level security;
alter table service_order_status_history enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table financial_categories enable row level security;
alter table financial_transactions enable row level security;
alter table whatsapp_templates enable row level security;
alter table whatsapp_messages enable row level security;
alter table whatsapp_queue enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

create or replace function auth_org_id()
returns uuid language sql stable as $$
  select organization_id from profiles where id = auth.uid()
$$;

-- Policy padrão: usuário só vê dados da própria organização
create policy "org_isolation" on customers
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on vehicles
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on services
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on suppliers
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on parts
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on stock_movements
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on service_orders
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on quotes
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on financial_categories
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on financial_transactions
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on whatsapp_templates
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on whatsapp_messages
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on whatsapp_queue
  for all using (organization_id = auth_org_id());
create policy "org_isolation" on notifications
  for all using (organization_id = auth_org_id() and (user_id = auth.uid() or user_id is null));
create policy "org_isolation" on audit_logs
  for all using (organization_id = auth_org_id());

-- Items derivam permissão do pai
create policy "via_parent" on service_order_items
  for all using (exists (
    select 1 from service_orders so where so.id = service_order_id and so.organization_id = auth_org_id()
  ));
create policy "via_parent" on service_order_status_history
  for all using (exists (
    select 1 from service_orders so where so.id = service_order_id and so.organization_id = auth_org_id()
  ));
create policy "via_parent" on quote_items
  for all using (exists (
    select 1 from quotes q where q.id = quote_id and q.organization_id = auth_org_id()
  ));

-- Profiles: vê os da mesma org
create policy "same_org_profiles" on profiles
  for select using (organization_id = auth_org_id());
create policy "self_profile_update" on profiles
  for update using (id = auth.uid());

-- Organização: vê a própria
create policy "own_org" on organizations
  for select using (id = auth_org_id());
create policy "owner_update_org" on organizations
  for update using (
    id = auth_org_id() and exists (
      select 1 from profiles where id = auth.uid() and role in ('owner','admin')
    )
  );
