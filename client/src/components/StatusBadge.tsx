import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type OrderStatus = "pending" | "approved" | "processing" | "completed" | "cancelled";
export type UserStatus = "pending" | "approved" | "rejected";

interface StatusBadgeProps {
  status: OrderStatus | UserStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  processing: { label: "Processing", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
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
