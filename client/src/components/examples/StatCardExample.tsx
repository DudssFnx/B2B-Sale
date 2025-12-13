import { StatCard } from "../StatCard";
import { ShoppingCart, Package, Users } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Orders"
        value={142}
        icon={ShoppingCart}
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
    </div>
  );
}
