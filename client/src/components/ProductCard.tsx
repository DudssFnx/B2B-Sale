import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Plus } from "lucide-react";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand?: string;
  price: number;
  stock?: number;
  image?: string;
  showPrice?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showPrice?: boolean;
}

export function ProductCard({ product, onAddToCart, showPrice = true }: ProductCardProps) {
  const inStock = product.stock === undefined || product.stock > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card 
      className="overflow-hidden group"
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-square bg-muted/50 flex items-center justify-center relative overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Package className="h-20 w-20 text-muted-foreground/30" />
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="secondary">Sem Estoque</Badge>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {product.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1">
            {product.sku}
            {product.brand && <span> - {product.brand}</span>}
          </p>
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </div>
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            {showPrice ? (
              <span className="text-lg font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                {formatPrice(product.price)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Entre para ver</span>
            )}
            {product.stock !== undefined && inStock && (
              <p className="text-xs text-muted-foreground">
                {product.stock} em estoque
              </p>
            )}
          </div>
          <Button
            size="icon"
            onClick={() => onAddToCart?.(product)}
            disabled={!inStock}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
