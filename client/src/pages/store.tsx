import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Loader2, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  Store,
  Phone,
  X,
  Grid3X3,
  List,
  Home,
  ShoppingCart,
  MapPin,
  Mail
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Product as SchemaProduct, Category } from "@shared/schema";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface StoreInfo {
  id: string;
  slug: string;
  nomeFantasia: string | null;
  razaoSocial: string;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
}

interface ProductsResponse {
  products: SchemaProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export default function StorePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  
  const { addItem, itemCount, openCart } = useCart();
  const { toast } = useToast();

  const { data: storeInfo, isLoading: storeLoading, error: storeError } = useQuery<StoreInfo>({
    queryKey: ['/api/public/store', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/store/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Loja não encontrada');
        if (res.status === 403) throw new Error('Loja inativa');
        throw new Error('Erro ao carregar loja');
      }
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['/api/public/store', slug, 'categories'],
    queryFn: async () => {
      const res = await fetch(`/api/public/store/${slug}/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!slug && !!storeInfo,
  });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '24');
    if (selectedCategoryId) params.set('categoryId', String(selectedCategoryId));
    if (searchQuery) params.set('search', searchQuery);
    return params.toString();
  }, [page, selectedCategoryId, searchQuery]);

  const { data: productsResponse, isLoading: productsLoading } = useQuery<ProductsResponse>({
    queryKey: ['/api/public/store', slug, 'products', queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/public/store/${slug}/products?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    enabled: !!slug && !!storeInfo,
  });

  const productsData = productsResponse?.products || [];
  const totalPages = productsResponse?.totalPages || 1;
  const totalProducts = productsResponse?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategoryId]);

  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [productId]: newQty };
    });
  };

  const handleAddToCart = (product: SchemaProduct) => {
    const qty = quantities[product.id] || 1;
    addItem({
      productId: String(product.id),
      name: product.name,
      sku: product.sku || "",
      price: parseFloat(product.price),
      image: product.image || undefined,
      quantity: qty,
    });
    toast({
      title: "Adicionado ao carrinho",
      description: `${qty}x ${product.name}`,
    });
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (storeError || !storeInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Loja não encontrada</h1>
        <p className="text-muted-foreground">
          A loja que você procura não existe ou está inativa.
        </p>
        <Button onClick={() => setLocation("/")} data-testid="button-go-home">
          <Home className="h-4 w-4 mr-2" />
          Voltar ao início
        </Button>
      </div>
    );
  }

  const storeName = storeInfo.nomeFantasia || storeInfo.razaoSocial;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-bold text-lg" data-testid="text-store-name">{storeName}</h1>
                {storeInfo.cidade && storeInfo.estado && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {storeInfo.cidade}, {storeInfo.estado}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openCart}
                data-testid="button-store-cart"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                ({itemCount})
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-store-search"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-6">
          <aside className="hidden md:block w-48 flex-shrink-0">
            <h3 className="font-semibold mb-3">Categorias</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-1">
                <Button
                  variant={selectedCategoryId === undefined ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedCategoryId(undefined)}
                  data-testid="button-category-all"
                >
                  Todas
                </Button>
                {categoriesData.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategoryId === cat.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {totalProducts} produto(s) encontrado(s)
              </p>
            </div>

            {productsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : productsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Package className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {productsData.map((product) => (
                  <Card key={product.id} className="overflow-hidden" data-testid={`card-product-${product.id}`}>
                    <div className="aspect-square relative bg-muted">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                      <p className="text-lg font-bold text-primary mb-2">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, -1)}
                            data-testid={`button-qty-minus-${product.id}`}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {quantities[product.id] || 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, 1)}
                            data-testid={`button-qty-plus-${product.id}`}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToCart(product)}
                          data-testid={`button-add-cart-${product.id}`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {productsData.map((product) => (
                  <Card key={product.id} data-testid={`card-product-${product.id}`}>
                    <CardContent className="flex items-center gap-4 p-3">
                      <div className="w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        <p className="text-lg font-bold text-primary">
                          R$ {parseFloat(product.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, -1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {quantities[product.id] || 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(product.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="border-t mt-8 py-6 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{storeName}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {storeInfo.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {storeInfo.telefone}
                </span>
              )}
              {storeInfo.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {storeInfo.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
