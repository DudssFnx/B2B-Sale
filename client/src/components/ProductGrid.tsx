import { ProductCard, type Product } from "./ProductCard";
import { Package } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  showPrice?: boolean;
}

export function ProductGrid({ products, onAddToCart, showPrice = true }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">Tente ajustar seus filtros</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-products">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          showPrice={showPrice}
        />
      ))}
    </div>
  );
}
