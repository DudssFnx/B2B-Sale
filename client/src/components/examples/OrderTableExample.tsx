import { OrderTable } from "../OrderTable";

// todo: remove mock functionality
const mockOrders = [
  { id: "1", orderNumber: "ORD-2024-001", customer: "Acme Corp", date: "Dec 10, 2024", status: "pending" as const, total: 1250.00, itemCount: 5 },
  { id: "2", orderNumber: "ORD-2024-002", customer: "TechStart Inc", date: "Dec 9, 2024", status: "approved" as const, total: 890.50, itemCount: 3 },
  { id: "3", orderNumber: "ORD-2024-003", customer: "BuildRight LLC", date: "Dec 8, 2024", status: "completed" as const, total: 2340.00, itemCount: 12 },
  { id: "4", orderNumber: "ORD-2024-004", customer: "SafeWorks Co", date: "Dec 7, 2024", status: "cancelled" as const, total: 450.00, itemCount: 2 },
];

export default function OrderTableExample() {
  return (
    <OrderTable
      orders={mockOrders}
      onViewOrder={(o) => console.log("View:", o.orderNumber)}
      onEditOrder={(o) => console.log("Edit:", o.orderNumber)}
      onUpdateStatus={(o, s) => console.log("Update:", o.orderNumber, "to", s)}
    />
  );
}
