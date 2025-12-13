import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";

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

  return (
    <Card 
      className="overflow-hidden hover-elevate"
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-square bg-muted flex items-center justify-center relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="h-16 w-16 text-muted-foreground/50" />
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="secondary">Out of Stock</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {product.sku}
          </Badge>
          {product.brand && (
            <span className="text-xs text-muted-foreground">{product.brand}</span>
          )}
        </div>
        <h3 className="font-medium text-sm line-clamp-2 mb-1" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{product.category}</p>
        <div className="flex items-center justify-between gap-2">
          {showPrice ? (
            <span className="text-lg font-bold" data-testid={`text-product-price-${product.id}`}>
              ${product.price.toFixed(2)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Login to see price</span>
          )}
          <Button
            size="sm"
            onClick={() => onAddToCart?.(product)}
            disabled={!inStock}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
        {product.stock !== undefined && inStock && (
          <p className="text-xs text-muted-foreground mt-2">
            {product.stock} in stock
          </p>
        )}
      </CardContent>
    </Card>
  );
}
