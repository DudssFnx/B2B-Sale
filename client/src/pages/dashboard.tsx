import { StatCard } from "@/components/StatCard";
import { OrderTable, type Order } from "@/components/OrderTable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ClipboardList, Users, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Order as SchemaOrder, Product, User } from "@shared/schema";
import { format } from "date-fns";

interface OrderWithItems extends SchemaOrder {
  items?: { id: number; quantity: number }[];
}

export default function DashboardPage() {
  const { user, isAdmin, isSales } = useAuth();
  const showAllOrders = isAdmin || isSales;

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

  const recentOrders: Order[] = ordersData.slice(0, 5).map((order) => ({
    id: String(order.id),
    orderNumber: order.orderNumber,
    customer: order.userId.substring(0, 8) + "...",
    date: format(new Date(order.createdAt), "MMM d, yyyy"),
    status: order.status as Order["status"],
    total: parseFloat(order.total),
    itemCount: order.items?.length || 0,
  }));

  const pendingOrdersCount = ordersData.filter(o => o.status === "pending").length;
  const lastOrderDate = ordersData.length > 0 
    ? format(new Date(ordersData[0].createdAt), "MMM d")
    : "N/A";

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Painel</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo, {user?.name}</p>
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
