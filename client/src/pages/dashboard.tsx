import { StatCard } from "@/components/StatCard";
import { OrderTable, type Order } from "@/components/OrderTable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ClipboardList, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

// todo: remove mock functionality
const mockRecentOrders: Order[] = [
  { id: "1", orderNumber: "ORD-2024-001", customer: "Acme Corp", date: "Dec 10, 2024", status: "pending", total: 1250.00, itemCount: 5 },
  { id: "2", orderNumber: "ORD-2024-002", customer: "TechStart Inc", date: "Dec 9, 2024", status: "approved", total: 890.50, itemCount: 3 },
  { id: "3", orderNumber: "ORD-2024-003", customer: "BuildRight LLC", date: "Dec 8, 2024", status: "completed", total: 2340.00, itemCount: 12 },
];

export default function DashboardPage() {
  const { user, isAdmin, isSales } = useAuth();
  const showAllOrders = isAdmin || isSales;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isAdmin ? (
          <>
            <StatCard
              title="Total Orders"
              value={142}
              icon={ClipboardList}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Products"
              value={856}
              icon={Package}
              trend={{ value: 5, isPositive: true }}
            />
            <StatCard
              title="Customers"
              value={1248}
              icon={Users}
              trend={{ value: 8, isPositive: true }}
            />
          </>
        ) : (
          <>
            <StatCard
              title="My Orders"
              value={24}
              icon={ClipboardList}
            />
            <StatCard
              title="Pending Orders"
              value={3}
              icon={ShoppingCart}
            />
            <StatCard
              title="Last Order"
              value="Dec 10"
              icon={Package}
            />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            {showAllOrders ? "Recent Orders" : "My Recent Orders"}
          </h2>
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="link-view-all-orders">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <OrderTable
          orders={mockRecentOrders}
          showCustomer={showAllOrders}
          onViewOrder={(order) => console.log("View order:", order.orderNumber)}
        />
      </div>

      <div className="flex gap-4">
        <Link href="/catalog">
          <Button data-testid="button-browse-catalog">
            <Package className="h-4 w-4 mr-2" />
            Browse Catalog
          </Button>
        </Link>
      </div>
    </div>
  );
}
