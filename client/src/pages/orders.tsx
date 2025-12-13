import { useState } from "react";
import { OrderTable, type Order } from "@/components/OrderTable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { OrderStatus } from "@/components/StatusBadge";

// todo: remove mock functionality
const mockOrders: Order[] = [
  { id: "1", orderNumber: "ORD-2024-001", customer: "Acme Corp", date: "Dec 10, 2024", status: "pending", total: 1250.00, itemCount: 5 },
  { id: "2", orderNumber: "ORD-2024-002", customer: "TechStart Inc", date: "Dec 9, 2024", status: "approved", total: 890.50, itemCount: 3 },
  { id: "3", orderNumber: "ORD-2024-003", customer: "BuildRight LLC", date: "Dec 8, 2024", status: "completed", total: 2340.00, itemCount: 12 },
  { id: "4", orderNumber: "ORD-2024-004", customer: "SafeWorks Co", date: "Dec 7, 2024", status: "cancelled", total: 450.00, itemCount: 2 },
  { id: "5", orderNumber: "ORD-2024-005", customer: "Acme Corp", date: "Dec 6, 2024", status: "processing", total: 1890.00, itemCount: 8 },
  { id: "6", orderNumber: "ORD-2024-006", customer: "TechStart Inc", date: "Dec 5, 2024", status: "completed", total: 560.00, itemCount: 4 },
];

export default function OrdersPage() {
  const { isAdmin, isSales } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState(mockOrders);
  const [activeTab, setActiveTab] = useState("all");

  const showAllOrders = isAdmin || isSales;

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  const handleUpdateStatus = (order: Order, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
    toast({
      title: "Order Updated",
      description: `Order ${order.orderNumber} marked as ${status}`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your orders are being exported to CSV...",
    });
    console.log("Exporting orders:", filteredOrders);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">
            {showAllOrders ? "All Orders" : "My Orders"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showAllOrders 
              ? "Manage and track all customer orders"
              : "View and track your order history"
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOrders([...mockOrders])} data-testid="button-refresh-orders">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {showAllOrders && (
            <Button onClick={handleExport} data-testid="button-export-orders">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({orders.filter(o => o.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({orders.filter(o => o.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({orders.filter(o => o.status === "completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <OrderTable
            orders={filteredOrders}
            showCustomer={showAllOrders}
            onViewOrder={(order) => console.log("View:", order.orderNumber)}
            onEditOrder={(order) => console.log("Edit:", order.orderNumber)}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
