import { CartDrawer } from "../CartDrawer";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useEffect } from "react";

function CartDemo() {
  const { addItem, openCart, itemCount } = useCart();

  useEffect(() => {
    // todo: remove mock functionality
    addItem({ productId: "1", name: "Industrial Bearing", sku: "BRG-001", price: 149.99, quantity: 2 });
    addItem({ productId: "2", name: "Hydraulic Pump", sku: "HYD-102", price: 599.00, quantity: 1 });
  }, []);

  return (
    <div className="flex items-center gap-4">
      <Button onClick={openCart} data-testid="button-open-cart">
        <ShoppingCart className="h-4 w-4 mr-2" />
        Open Cart ({itemCount})
      </Button>
      <CartDrawer onGenerateOrder={() => console.log("Order generated!")} />
    </div>
  );
}

export default function CartDrawerExample() {
  return (
    <CartProvider>
      <CartDemo />
    </CartProvider>
  );
}
