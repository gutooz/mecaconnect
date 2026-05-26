import * as React from "react";
import { cn } from "@/lib/utils";
import type { ServiceOrderStatus, QuoteStatus, PaymentStatus } from "@/types/database";

export const OS_STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  received: "Recebido",
  analyzing: "Em análise",
  awaiting_approval: "Aguardando aprovação",
  in_progress: "Em manutenção",
  completed: "Finalizado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

const OS_STATUS_STYLES: Record<ServiceOrderStatus, string> = {
  received: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  analyzing: "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20",
  awaiting_approval: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  in_progress: "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-orange-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  delivered: "bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/20",
  canceled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20",
};

export function ServiceOrderStatusBadge({ status, className }: { status: ServiceOrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        OS_STATUS_STYLES[status],
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {OS_STATUS_LABEL[status]}
    </span>
  );
}

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Recusado",
  expired: "Expirado",
  converted: "Convertido em OS",
};

const QUOTE_STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  sent: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  expired: "bg-orange-500/10 text-orange-600 ring-orange-500/20",
  converted: "bg-violet-500/10 text-violet-600 ring-violet-500/20",
};

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        QUOTE_STATUS_STYLES[status],
        className,
      )}
    >
      {QUOTE_STATUS_LABEL[status]}
    </span>
  );
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendente",
  partial: "Parcial",
  paid: "Pago",
  overdue: "Vencido",
  canceled: "Cancelado",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  partial: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  overdue: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
  canceled: "bg-muted text-muted-foreground ring-border",
};

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        PAYMENT_STATUS_STYLES[status],
        className,
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
