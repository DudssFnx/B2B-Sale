import { StatCard } from "@/components/StatCard";
import { OrderTable, type Order } from "@/components/OrderTable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Package, ClipboardList, Users, ArrowRight, Loader2, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Order as SchemaOrder, Product, User } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderWithItems extends SchemaOrder {
  items?: { id: number; quantity: number }[];
}

interface PurchaseStats {
  totalSpent: number;
  totalOrders: number;
  completedOrders: number;
  monthlyStats: Array<{ month: string; total: number; count: number }>;
  topProducts: Array<{ productId: number; name: string; totalQuantity: number; totalValue: number }>;
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return format(date, "MMM yyyy", { locale: ptBR });
}

export default function DashboardPage() {
  const { user, isAdmin, isSales } = useAuth();
  const showAllOrders = isAdmin || isSales;
  const isCustomer = !isAdmin && !isSales;

  const { data: ordersData = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders'],
  });

  const { data: productsData = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: isAdmin,
  });

  const { data: usersData = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: isAdmin,
  });

  const { data: purchaseStats, isLoading: statsLoading } = useQuery<PurchaseStats>({
    queryKey: ['/api/me/purchase-stats'],
    enabled: isCustomer,
  });

  const recentOrders: Order[] = ordersData.slice(0, 5).map((order) => ({
    id: String(order.id),
    orderNumber: order.orderNumber,
    customer: order.userId.substring(0, 8) + "...",
    date: format(new Date(order.createdAt), "MMM d, yyyy"),
    status: order.status as Order["status"],
    total: parseFloat(order.total),
    itemCount: order.items?.length || 0,
  }));

  const pendingOrdersCount = ordersData.filter(o => o.status === "pending" || o.status === "ORCAMENTO_ABERTO" || o.status === "ORCAMENTO_CONCLUIDO").length;
  const lastOrderDate = ordersData.length > 0 
    ? format(new Date(ordersData[0].createdAt), "dd MMM", { locale: ptBR })
    : "N/A";

  if (isCustomer) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Painel</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo, {user?.firstName || user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Comprado"
            value={statsLoading ? "..." : `R$ ${(purchaseStats?.totalSpent || 0).toFixed(2)}`}
            icon={DollarSign}
            data-testid="stat-total-spent"
          />
          <StatCard
            title="Pedidos Realizados"
            value={statsLoading ? "..." : purchaseStats?.totalOrders || 0}
            icon={ClipboardList}
            data-testid="stat-total-orders"
          />
          <StatCard
            title="Pedidos Faturados"
            value={statsLoading ? "..." : purchaseStats?.completedOrders || 0}
            icon={Package}
            data-testid="stat-completed-orders"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Compras por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !purchaseStats?.monthlyStats?.length ? (
                <p className="text-muted-foreground text-sm py-4">Nenhuma compra registrada</p>
              ) : (
                <div className="space-y-3">
                  {purchaseStats.monthlyStats.map((stat) => (
                    <div key={stat.month} className="flex items-center justify-between gap-4" data-testid={`monthly-stat-${stat.month}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{formatMonthLabel(stat.month)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">R$ {stat.total.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({stat.count} pedido{stat.count > 1 ? 's' : ''})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                Produtos Mais Comprados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !purchaseStats?.topProducts?.length ? (
                <p className="text-muted-foreground text-sm py-4">Nenhum produto comprado ainda</p>
              ) : (
                <div className="space-y-3">
                  {purchaseStats.topProducts.map((product, idx) => (
                    <div key={product.productId} className="flex items-center justify-between gap-4" data-testid={`top-product-${product.productId}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-xs font-medium w-5">{idx + 1}.</span>
                        <span className="text-sm font-medium truncate max-w-[200px]">{product.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-semibold">{product.totalQuantity} un.</span>
                        <span className="text-xs text-muted-foreground ml-2">R$ {product.totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Meus Pedidos Recentes</h2>
            <Link href="/orders">
              <Button variant="ghost" size="sm" data-testid="link-view-all-orders">
                Ver Todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pedido ainda
            </div>
          ) : (
            <OrderTable
              orders={recentOrders}
              showCustomer={false}
              onViewOrder={(order) => console.log("View order:", order.orderNumber)}
            />
          )}
        </div>

        <div className="flex gap-4">
          <Link href="/catalog">
            <Button data-testid="button-browse-catalog">
              <Package className="h-4 w-4 mr-2" />
              Ver Catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Painel</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo, {user?.firstName || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isAdmin ? (
          <>
            <StatCard
              title="Total de Pedidos"
              value={ordersLoading ? "..." : ordersData.length}
              icon={ClipboardList}
            />
            <StatCard
              title="Produtos"
              value={productsLoading ? "..." : productsData.length}
              icon={Package}
            />
            <StatCard
              title="Clientes"
              value={usersLoading ? "..." : usersData.filter(u => u.role === "customer").length}
              icon={Users}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Meus Pedidos"
              value={ordersLoading ? "..." : ordersData.length}
              icon={ClipboardList}
            />
            <StatCard
              title="Pedidos Pendentes"
              value={ordersLoading ? "..." : pendingOrdersCount}
              icon={ShoppingCart}
            />
            <StatCard
              title="Último Pedido"
              value={ordersLoading ? "..." : lastOrderDate}
              icon={Package}
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            {showAllOrders ? "Pedidos Recentes" : "Meus Pedidos Recentes"}
          </h2>
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="link-view-all-orders">
              Ver Todos <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum pedido ainda
          </div>
        ) : (
          <OrderTable
            orders={recentOrders}
            showCustomer={showAllOrders}
            onViewOrder={(order) => console.log("View order:", order.orderNumber)}
          />
        )}
      </div>

      <div className="flex gap-4">
        <Link href="/catalog">
          <Button data-testid="button-browse-catalog">
            <Package className="h-4 w-4 mr-2" />
            Ver Catálogo
          </Button>
        </Link>
      </div>
    </div>
  );
}
