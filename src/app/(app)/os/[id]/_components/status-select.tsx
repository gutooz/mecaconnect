"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { ServiceOrderStatusBadge, OS_STATUS_LABEL } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateServiceOrderStatus } from "@/lib/actions";
import type { ServiceOrderStatus } from "@/types/database";

const ORDER: ServiceOrderStatus[] = [
  "received", "analyzing", "awaiting_approval", "in_progress", "completed", "delivered", "canceled",
];

export function OSStatusSelect({ id, status }: { id: string; status: ServiceOrderStatus }) {
  const [pending, setPending] = React.useState(false);
  const [current, setCurrent] = React.useState<ServiceOrderStatus>(status);

  async function change(next: ServiceOrderStatus) {
    setPending(true);
    try {
      await updateServiceOrderStatus(id, next);
      setCurrent(next);
      toast.success(`Status atualizado para "${OS_STATUS_LABEL[next]}"`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={pending}
          className="inline-flex items-center disabled:opacity-50"
          aria-label="Alterar status"
        >
          <ServiceOrderStatusBadge status={current} className="cursor-pointer hover:opacity-80" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {ORDER.map((s) => (
          <DropdownMenuItem key={s} onClick={() => change(s)}>
            {s === current && <Check className="size-3" />}
            <span className={s === current ? "font-semibold" : ""}>{OS_STATUS_LABEL[s]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
