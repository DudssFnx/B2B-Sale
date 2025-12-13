import { useState } from "react";
import { OrderTable, type Order } from "@/components/OrderTable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Loader2, Package, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Order as SchemaOrder } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

interface OrderWithItems extends SchemaOrder {
  items?: { id: number; quantity: number }[];
}

function getCustomerStatusLabel(status: string): string {
  const inProgress = ["ORCAMENTO_ABERTO", "ORCAMENTO_CONCLUIDO", "PEDIDO_GERADO", "pending", "approved", "processing"];
  if (inProgress.includes(status)) return "Em andamento";
  if (status === "PEDIDO_FATURADO" || status === "completed") return "Faturado";
  if (status === "PEDIDO_CANCELADO" || status === "cancelled") return "Cancelado";
  return "Processando";
}

function getCustomerStatusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "PEDIDO_FATURADO" || status === "completed") return "default";
  if (status === "PEDIDO_CANCELADO" || status === "cancelled") return "destructive";
  return "secondary";
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

  const newStatuses = ["ORCAMENTO_ABERTO", "ORCAMENTO_CONCLUIDO", "PEDIDO_GERADO", "PEDIDO_FATURADO", "PEDIDO_CANCELADO"];
  
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    if (activeTab === "legacy") return !newStatuses.includes(order.status);
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

  const handleUpdateStatus = (order: Order, status: string) => {
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

  if (!showAllOrders) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">Meus Pedidos</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e acompanhe seu histórico de pedidos
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-orders">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não tem pedidos</p>
            <p className="text-sm mt-1">Adicione produtos ao carrinho para fazer seu primeiro pedido</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} data-testid={`card-order-${order.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold" data-testid={`text-order-number-${order.id}`}>
                          {order.orderNumber}
                        </span>
                        <Badge 
                          variant={getCustomerStatusVariant(order.status)}
                          data-testid={`badge-status-${order.id}`}
                        >
                          {getCustomerStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(ordersData.find(o => String(o.id) === order.id)?.createdAt || new Date()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">R$ {order.total.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{order.itemCount} itens</p>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Todos os Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe todos os pedidos de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-orders">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExport} data-testid="button-export-orders">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" data-testid="tab-all">Todos ({orders.length})</TabsTrigger>
          <TabsTrigger value="ORCAMENTO_ABERTO" data-testid="tab-orcamento-aberto">
            Orçamentos ({orders.filter(o => o.status === "ORCAMENTO_ABERTO").length})
          </TabsTrigger>
          <TabsTrigger value="ORCAMENTO_CONCLUIDO" data-testid="tab-orcamento-concluido">
            Enviados ({orders.filter(o => o.status === "ORCAMENTO_CONCLUIDO").length})
          </TabsTrigger>
          <TabsTrigger value="PEDIDO_GERADO" data-testid="tab-pedido-gerado">
            Pedidos ({orders.filter(o => o.status === "PEDIDO_GERADO").length})
          </TabsTrigger>
          <TabsTrigger value="PEDIDO_FATURADO" data-testid="tab-pedido-faturado">
            Faturados ({orders.filter(o => o.status === "PEDIDO_FATURADO").length})
          </TabsTrigger>
          <TabsTrigger value="legacy" data-testid="tab-legacy">
            Outros ({orders.filter(o => !newStatuses.includes(o.status)).length})
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
              showCustomer={true}
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
