import { useState } from "react";
import { OrderTable, type Order } from "@/components/OrderTable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus } from "@/components/StatusBadge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Order as SchemaOrder } from "@shared/schema";
import { format } from "date-fns";

interface OrderWithItems extends SchemaOrder {
  items?: { id: number; quantity: number }[];
}

export default function OrdersPage() {
  const { isAdmin, isSales } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const showAllOrders = isAdmin || isSales;

  const { data: ordersData = [], isLoading, refetch } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders'],
  });

  const orders: Order[] = ordersData.map((order) => ({
    id: String(order.id),
    orderNumber: order.orderNumber,
    customer: order.userId.substring(0, 8) + "...",
    date: format(new Date(order.createdAt), "MMM d, yyyy"),
    status: order.status as Order["status"],
    total: parseFloat(order.total),
    itemCount: order.items?.length || 0,
  }));

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });

  const handleUpdateStatus = (order: Order, status: OrderStatus) => {
    updateStatusMutation.mutate(
      { orderId: order.id, status },
      {
        onSuccess: () => {
          toast({
            title: "Pedido Atualizado",
            description: `Pedido ${order.orderNumber} marcado como ${status}`,
          });
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Falha ao atualizar status do pedido",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/orders/export/csv", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "orders.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportação Concluída",
        description: "Os pedidos foram exportados para CSV",
      });
    } catch (error) {
      toast({
        title: "Falha na Exportação",
        description: "Não foi possível exportar os pedidos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">
            {showAllOrders ? "Todos os Pedidos" : "Meus Pedidos"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showAllOrders 
              ? "Gerencie e acompanhe todos os pedidos de clientes"
              : "Visualize e acompanhe seu histórico de pedidos"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-orders">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {showAllOrders && (
            <Button onClick={handleExport} data-testid="button-export-orders">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pendentes ({orders.filter(o => o.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Aprovados ({orders.filter(o => o.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Concluídos ({orders.filter(o => o.status === "completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          ) : (
            <OrderTable
              orders={filteredOrders}
              showCustomer={showAllOrders}
              onViewOrder={(order) => console.log("View:", order.orderNumber)}
              onEditOrder={(order) => console.log("Edit:", order.orderNumber)}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
