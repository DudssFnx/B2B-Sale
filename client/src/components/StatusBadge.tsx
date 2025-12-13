import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus = "pending" | "approved" | "processing" | "completed" | "cancelled";
export type UserStatus = "pending" | "approved" | "rejected";

interface StatusBadgeProps {
  status: OrderStatus | UserStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  processing: { label: "Processando", variant: "outline" },
  completed: { label: "Concluído", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };

  return (
    <Badge 
      variant={config.variant} 
      className={cn("text-xs font-semibold", className)}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
