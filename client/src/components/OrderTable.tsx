import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge, StageProgress, getNextStage, getStageLabel, STAGES, getStageIndex } from "./StatusBadge";
import { Eye, Printer, Package, DollarSign, FileCheck, Search, Truck, Send, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  date: string;
  status: string;
  stage: string;
  total: number;
  itemCount: number;
  printed?: boolean;
}

interface OrderTableProps {
  orders: Order[];
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  onUpdateStatus?: (order: Order, status: string) => void;
  onUpdateStage?: (order: Order, stage: string) => void;
  onPrintOrder?: (order: Order) => void;
  onReserveStock?: (order: Order) => void;
  onInvoice?: (order: Order) => void;
  showCustomer?: boolean;
  selectedOrderIds?: Set<string>;
  onSelectionChange?: (orderId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

function getStageActionConfig(stage: string): { 
  icon: typeof Printer; 
  label: string; 
  nextStage: string | null;
  buttonVariant: "outline" | "default";
} | null {
  const normalizedStage = stage === "PENDENTE_IMPRESSAO" ? "AGUARDANDO_IMPRESSAO" :
                          stage === "IMPRESSO" ? "PEDIDO_IMPRESSO" :
                          stage === "SEPARADO" ? "PEDIDO_SEPARADO" :
                          stage === "FINALIZADO" ? "PEDIDO_ENVIADO" : stage;
  
  switch (normalizedStage) {
    case "AGUARDANDO_IMPRESSAO":
      return { icon: Printer, label: "Imprimir", nextStage: "PEDIDO_IMPRESSO", buttonVariant: "outline" };
    case "PEDIDO_IMPRESSO":
      return { icon: Package, label: "Separar", nextStage: "PEDIDO_SEPARADO", buttonVariant: "default" };
    case "PEDIDO_SEPARADO":
      return { icon: DollarSign, label: "Cobrar", nextStage: "COBRADO", buttonVariant: "default" };
    case "COBRADO":
      return { icon: FileCheck, label: "Conferir Comprovante", nextStage: "CONFERIR_COMPROVANTE", buttonVariant: "default" };
    case "CONFERIR_COMPROVANTE":
      return { icon: Search, label: "Em Conferência", nextStage: "EM_CONFERENCIA", buttonVariant: "default" };
    case "EM_CONFERENCIA":
      return { icon: Truck, label: "Aguardar Envio", nextStage: "AGUARDANDO_ENVIO", buttonVariant: "default" };
    case "AGUARDANDO_ENVIO":
      return { icon: Send, label: "Enviar", nextStage: "PEDIDO_ENVIADO", buttonVariant: "default" };
    case "PEDIDO_ENVIADO":
      return null;
    default:
      return null;
  }
}

function StageActions({ 
  order, 
  onPrintOrder,
  onUpdateStage 
}: { 
  order: Order; 
  onPrintOrder?: (order: Order) => void;
  onUpdateStage?: (order: Order, stage: string) => void;
}) {
  const { status, stage } = order;

  if (status === "CANCELADO" || status === "PEDIDO_CANCELADO") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Cancelado</span>
      </div>
    );
  }

  const actionConfig = getStageActionConfig(stage);
  const currentIndex = getStageIndex(stage);
  const currentStageLabel = getStageLabel(stage);

  return (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <StageProgress currentStage={stage} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            <p className="font-semibold">Etapa {currentIndex + 1} de {STAGES.length}</p>
            <p>{currentStageLabel}</p>
          </div>
        </TooltipContent>
      </Tooltip>

      {actionConfig && (
        <Button
          variant={actionConfig.buttonVariant}
          size="sm"
          onClick={() => {
            if (actionConfig.nextStage === "PEDIDO_IMPRESSO" && onPrintOrder) {
              onPrintOrder(order);
            } else if (actionConfig.nextStage && onUpdateStage) {
              onUpdateStage(order, actionConfig.nextStage);
            }
          }}
          className="gap-1"
          data-testid={`button-stage-${order.id}`}
        >
          <actionConfig.icon className="h-3 w-3" />
          <span className="hidden sm:inline">{actionConfig.label}</span>
          <ChevronRight className="h-3 w-3 sm:hidden" />
        </Button>
      )}
    </div>
  );
}

export function OrderTable({ 
  orders, 
  onViewOrder, 
  onEditOrder, 
  onUpdateStatus,
  onUpdateStage,
  onPrintOrder,
  onReserveStock,
  onInvoice,
  showCustomer = true,
  selectedOrderIds,
  onSelectionChange,
  onSelectAll,
}: OrderTableProps) {
  const allSelected = orders.length > 0 && selectedOrderIds && orders.every(o => selectedOrderIds.has(o.id));
  const someSelected = selectedOrderIds && orders.some(o => selectedOrderIds.has(o.id)) && !allSelected;

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {onSelectionChange && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll?.(!!checked)}
                  data-testid="checkbox-select-all"
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
            )}
            <TableHead className="font-semibold">Pedido #</TableHead>
            {showCustomer && <TableHead className="font-semibold">Cliente</TableHead>}
            <TableHead className="font-semibold">Data</TableHead>
            <TableHead className="font-semibold">Itens</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Etapa</TableHead>
            <TableHead className="font-semibold text-right">Total</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, idx) => (
            <TableRow 
              key={order.id} 
              className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
              data-testid={`row-order-${order.id}`}
            >
              {onSelectionChange && (
                <TableCell>
                  <Checkbox
                    checked={selectedOrderIds?.has(order.id) || false}
                    onCheckedChange={(checked) => onSelectionChange(order.id, !!checked)}
                    data-testid={`checkbox-order-${order.id}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                {order.orderNumber}
              </TableCell>
              {showCustomer && (
                <TableCell>{order.customer}</TableCell>
              )}
              <TableCell className="text-muted-foreground">{order.date}</TableCell>
              <TableCell>{order.itemCount} itens</TableCell>
              <TableCell>
                <StatusBadge status={order.status as any} />
              </TableCell>
              <TableCell>
                <StageActions 
                  order={order} 
                  onPrintOrder={onPrintOrder}
                  onUpdateStage={onUpdateStage}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {order.total.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 justify-end">
                  <Link href={`/orders/${order.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
