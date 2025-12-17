import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Minus, ShoppingCart, Tag, Store } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

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
  featured?: boolean;
  description?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  showPrice?: boolean;
}

export function ProductCard({ product, onAddToCart, showPrice = true }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [dialogQuantity, setDialogQuantity] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const inStock = product.stock === undefined || product.stock > 0;
  const maxStock = product.stock ?? 999;

  const { data: retailModeSetting } = useQuery<{ key: string; value: string | null }>({
    queryKey: ['/api/settings/retail_mode_enabled'],
  });

  const { data: retailMarkupSetting } = useQuery<{ key: string; value: string | null }>({
    queryKey: ['/api/settings/retail_markup_percentage'],
  });

  const isRetailModeEnabled = retailModeSetting?.value === 'true';
  const retailMarkupPercentage = parseFloat(retailMarkupSetting?.value || '30');
  const retailPrice = product.price * (1 + retailMarkupPercentage / 100);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleIncrement = () => {
    if (quantity < maxStock) {
      setQuantity(q => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleDialogIncrement = () => {
    if (dialogQuantity < maxStock) {
      setDialogQuantity(q => q + 1);
    }
  };

  const handleDialogDecrement = () => {
    if (dialogQuantity > 1) {
      setDialogQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart?.(product, quantity);
    setQuantity(1);
  };

  const handleDialogAddToCart = () => {
    onAddToCart?.(product, dialogQuantity);
    setDialogQuantity(1);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card 
          className="overflow-hidden group hover-elevate transition-all duration-200 cursor-pointer"
          data-testid={`card-product-${product.id}`}
        >
          <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <Package className="h-16 w-16 text-muted-foreground/20" />
            )}
            {!inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                <Badge variant="destructive">Indisponivel</Badge>
              </div>
            )}
            {product.brand && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs font-medium bg-background/90 backdrop-blur-sm">
                  {product.brand}
                </Badge>
              </div>
            )}
          </div>
          <CardContent className="p-3">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1 font-mono">
                {product.sku}
              </p>
              <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] leading-tight" data-testid={`text-product-name-${product.id}`}>
                {product.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {product.category}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-baseline gap-1">
                {showPrice ? (
                  <>
                    <span className="text-xl font-bold" data-testid={`text-product-price-${product.id}`}>
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">/un</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Faca login para ver precos</span>
                )}
              </div>
              
              {product.stock !== undefined && inStock && (
                <p className="text-xs text-muted-foreground">
                  {product.stock} disponiveis
                </p>
              )}
              
              {showPrice && inStock && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center border rounded-md">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-r-none"
                      onClick={(e) => { e.stopPropagation(); handleDecrement(); }}
                      disabled={quantity <= 1}
                      data-testid={`button-decrement-${product.id}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium" data-testid={`text-quantity-${product.id}`}>
                      {quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-l-none"
                      onClick={(e) => { e.stopPropagation(); handleIncrement(); }}
                      disabled={quantity >= maxStock}
                      data-testid={`button-increment-${product.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                    disabled={!inStock}
                    data-testid={`button-add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
              )}
              
              {showPrice && !inStock && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled
                >
                  Indisponivel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-20 w-20 text-muted-foreground/20" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{product.sku}</Badge>
            <Badge variant="secondary">{product.category}</Badge>
            {product.brand && <Badge>{product.brand}</Badge>}
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          {showPrice && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <span className="font-medium">Preco Atacado:</span>
                <span className="text-2xl font-bold text-primary" data-testid="text-wholesale-price">
                  {formatPrice(product.price)}
                </span>
              </div>
              
              {isRetailModeEnabled && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Preco Varejo (+{retailMarkupPercentage}%):</span>
                  <span className="text-xl font-semibold text-muted-foreground" data-testid="text-retail-price">
                    {formatPrice(retailPrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          {product.stock !== undefined && (
            <p className="text-sm text-muted-foreground">
              Estoque: <span className={inStock ? "text-green-600 dark:text-green-400 font-medium" : "text-destructive font-medium"}>
                {inStock ? `${product.stock} unidades` : 'Indisponivel'}
              </span>
            </p>
          )}

          {showPrice && inStock && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border rounded-md">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDialogDecrement}
                  disabled={dialogQuantity <= 1}
                  data-testid="button-dialog-decrement"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium" data-testid="text-dialog-quantity">
                  {dialogQuantity}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDialogIncrement}
                  disabled={dialogQuantity >= maxStock}
                  data-testid="button-dialog-increment"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                className="flex-1 gap-2"
                onClick={handleDialogAddToCart}
                data-testid="button-dialog-add-to-cart"
              >
                <ShoppingCart className="h-4 w-4" />
                Adicionar ao Carrinho
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
