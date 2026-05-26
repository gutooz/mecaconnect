// Tipos do banco de dados. Em produção, gere com `supabase gen types typescript`.
//
// Importante: usamos `type` (não `interface`) para que cada Row seja assignable
// a `Record<string, unknown>` — restrição de `GenericTable` do @supabase/postgrest-js.

export type UserRole = "owner" | "admin" | "manager" | "mechanic" | "attendant";

export type ServiceOrderStatus =
  | "received"
  | "analyzing"
  | "awaiting_approval"
  | "in_progress"
  | "completed"
  | "delivered"
  | "canceled";

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "converted";

export type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "canceled";

export type PaymentMethod =
  | "cash"
  | "pix"
  | "debit_card"
  | "credit_card"
  | "bank_transfer"
  | "check"
  | "other";

export type TransactionType = "income" | "expense";

export type StockMovementType = "in" | "out" | "adjustment" | "used_in_service";

export type WhatsappEventType =
  | "os_created"
  | "os_status_changed"
  | "vehicle_ready"
  | "quote_sent"
  | "quote_approval_pending"
  | "payment_reminder"
  | "service_reminder"
  | "satisfaction_survey";

export type ItemType = "service" | "part" | "labor" | "other";

export type WhatsappDirection = "inbound" | "outbound";

export type WhatsappQueueStatus = "queued" | "processing" | "sent" | "failed";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  primary_color: string;
  whatsapp_instance: string | null;
  whatsapp_connected: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  permissions: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  document: string | null;
  birth_date: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  notes: string | null;
  tags: string[];
  total_spent: number;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Vehicle = {
  id: string;
  organization_id: string;
  customer_id: string;
  brand: string;
  model: string;
  year: number | null;
  plate: string;
  color: string | null;
  current_km: number;
  chassis: string | null;
  engine: string | null;
  fuel_type: string | null;
  notes: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  default_price: number;
  estimated_duration_minutes: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  organization_id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type Part = {
  id: string;
  organization_id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  category: string | null;
  supplier_id: string | null;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock: number;
  location: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  organization_id: string;
  part_id: string;
  type: StockMovementType;
  quantity: number;
  unit_cost: number | null;
  reason: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type ServiceOrder = {
  id: string;
  organization_id: string;
  number: number;
  customer_id: string;
  vehicle_id: string;
  assigned_mechanic_id: string | null;
  status: ServiceOrderStatus;
  reported_problem: string | null;
  diagnosis: string | null;
  internal_notes: string | null;
  current_km: number | null;
  fuel_level: string | null;
  photos: string[];
  videos: string[];
  checklist: Record<string, unknown>;
  customer_signature: string | null;
  mechanic_signature: string | null;
  public_token: string;
  labor_total: number;
  parts_total: number;
  services_total: number;
  discount: number;
  tax: number;
  total: number;
  expected_delivery_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceOrderItem = {
  id: string;
  service_order_id: string;
  service_id: string | null;
  part_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  item_type: ItemType;
  created_at: string;
};

export type ServiceOrderStatusHistory = {
  id: string;
  service_order_id: string;
  from_status: ServiceOrderStatus | null;
  to_status: ServiceOrderStatus;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  organization_id: string;
  number: number;
  customer_id: string;
  vehicle_id: string | null;
  status: QuoteStatus;
  valid_until: string | null;
  notes: string | null;
  internal_notes: string | null;
  public_token: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  approved_at: string | null;
  approved_signature: string | null;
  converted_service_order_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  service_id: string | null;
  part_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  item_type: ItemType;
  created_at: string;
};

export type FinancialCategory = {
  id: string;
  organization_id: string;
  name: string;
  type: TransactionType;
  color: string;
  created_at: string;
};

export type FinancialTransaction = {
  id: string;
  organization_id: string;
  type: TransactionType;
  category_id: string | null;
  description: string;
  amount: number;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  service_order_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  notes: string | null;
  attachments: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WhatsappTemplate = {
  id: string;
  organization_id: string;
  event_type: WhatsappEventType;
  name: string;
  message_template: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type WhatsappMessage = {
  id: string;
  organization_id: string;
  customer_id: string | null;
  phone: string;
  direction: WhatsappDirection;
  event_type: WhatsappEventType | null;
  message: string;
  media_url: string | null;
  external_id: string | null;
  status: string;
  service_order_id: string | null;
  quote_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
};

export type WhatsappQueueItem = {
  id: string;
  organization_id: string;
  customer_id: string | null;
  phone: string;
  message: string;
  media_url: string | null;
  event_type: WhatsappEventType | null;
  service_order_id: string | null;
  quote_id: string | null;
  scheduled_for: string;
  attempts: number;
  max_attempts: number;
  status: WhatsappQueueStatus;
  last_error: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  organization_id: string;
  user_id: string | null;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type Rel<C extends string, R extends string> = {
  foreignKeyName: string;
  columns: [C];
  isOneToOne: false;
  referencedRelation: R;
  referencedColumns: ["id"];
};

type TableShape<Row, Relationships extends readonly unknown[] = []> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type Database = {
  public: {
    Tables: {
      organizations: TableShape<Organization>;
      profiles: TableShape<Profile, [Rel<"organization_id", "organizations">]>;
      customers: TableShape<Customer, [Rel<"organization_id", "organizations">]>;
      vehicles: TableShape<
        Vehicle,
        [Rel<"organization_id", "organizations">, Rel<"customer_id", "customers">]
      >;
      services: TableShape<Service, [Rel<"organization_id", "organizations">]>;
      suppliers: TableShape<Supplier, [Rel<"organization_id", "organizations">]>;
      parts: TableShape<
        Part,
        [Rel<"organization_id", "organizations">, Rel<"supplier_id", "suppliers">]
      >;
      stock_movements: TableShape<
        StockMovement,
        [
          Rel<"organization_id", "organizations">,
          Rel<"part_id", "parts">,
          Rel<"created_by", "profiles">,
        ]
      >;
      service_orders: TableShape<
        ServiceOrder,
        [
          Rel<"organization_id", "organizations">,
          Rel<"customer_id", "customers">,
          Rel<"vehicle_id", "vehicles">,
          Rel<"assigned_mechanic_id", "profiles">,
          Rel<"created_by", "profiles">,
        ]
      >;
      service_order_items: TableShape<
        ServiceOrderItem,
        [
          Rel<"service_order_id", "service_orders">,
          Rel<"service_id", "services">,
          Rel<"part_id", "parts">,
        ]
      >;
      service_order_status_history: TableShape<
        ServiceOrderStatusHistory,
        [Rel<"service_order_id", "service_orders">, Rel<"changed_by", "profiles">]
      >;
      quotes: TableShape<
        Quote,
        [
          Rel<"organization_id", "organizations">,
          Rel<"customer_id", "customers">,
          Rel<"vehicle_id", "vehicles">,
          Rel<"created_by", "profiles">,
          Rel<"converted_service_order_id", "service_orders">,
        ]
      >;
      quote_items: TableShape<
        QuoteItem,
        [Rel<"quote_id", "quotes">, Rel<"service_id", "services">, Rel<"part_id", "parts">]
      >;
      financial_categories: TableShape<
        FinancialCategory,
        [Rel<"organization_id", "organizations">]
      >;
      financial_transactions: TableShape<
        FinancialTransaction,
        [
          Rel<"organization_id", "organizations">,
          Rel<"category_id", "financial_categories">,
          Rel<"service_order_id", "service_orders">,
          Rel<"customer_id", "customers">,
          Rel<"supplier_id", "suppliers">,
          Rel<"created_by", "profiles">,
        ]
      >;
      whatsapp_templates: TableShape<WhatsappTemplate, [Rel<"organization_id", "organizations">]>;
      whatsapp_messages: TableShape<
        WhatsappMessage,
        [
          Rel<"organization_id", "organizations">,
          Rel<"customer_id", "customers">,
          Rel<"service_order_id", "service_orders">,
          Rel<"quote_id", "quotes">,
        ]
      >;
      whatsapp_queue: TableShape<
        WhatsappQueueItem,
        [
          Rel<"organization_id", "organizations">,
          Rel<"customer_id", "customers">,
          Rel<"service_order_id", "service_orders">,
          Rel<"quote_id", "quotes">,
        ]
      >;
      notifications: TableShape<
        Notification,
        [Rel<"organization_id", "organizations">, Rel<"user_id", "profiles">]
      >;
      audit_logs: TableShape<
        AuditLog,
        [Rel<"organization_id", "organizations">, Rel<"user_id", "profiles">]
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      service_order_status: ServiceOrderStatus;
      quote_status: QuoteStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      transaction_type: TransactionType;
      stock_movement_type: StockMovementType;
      whatsapp_event_type: WhatsappEventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
