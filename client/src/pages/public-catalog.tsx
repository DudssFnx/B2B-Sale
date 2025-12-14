import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  Loader2, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  Store,
  Phone,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Product as SchemaProduct, Category } from "@shared/schema";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoImage from "@assets/image_1765659931449.png";

interface ProductsResponse {
  products: SchemaProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export default function PublicCatalogPage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['/api/public/categories'],
    queryFn: async () => {
      const res = await fetch('/api/public/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const categoryParam = params.get("category");
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam);
      setCategory(decodedCategory);
      const cat = categoriesData.find(c => c.name === decodedCategory);
      if (cat) {
        setSelectedCategoryId(cat.id);
      }
    }
  }, [searchString, categoriesData]);

  useEffect(() => {
    if (category === "all") {
      setSelectedCategoryId(undefined);
    } else {
      const cat = categoriesData.find(c => c.name === category);
      setSelectedCategoryId(cat?.id);
    }
    setPage(1);
  }, [category, categoriesData]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, brand]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '50');
    if (selectedCategoryId) params.set('categoryId', String(selectedCategoryId));
    if (searchQuery) params.set('search', searchQuery);
    return params.toString();
  }, [page, selectedCategoryId, searchQuery]);

  const { data: productsResponse, isLoading: productsLoading } = useQuery<ProductsResponse>({
    queryKey: ['/api/public/products', queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/public/products?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const productsData = productsResponse?.products || [];
  const totalPages = productsResponse?.totalPages || 1;

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    categoriesData.forEach(cat => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categoriesData]);

  const categories = useMemo(() => {
    return categoriesData.map(c => c.name);
  }, [categoriesData]);

  const brands = useMemo(() => {
    const brandSet = new Set<string>();
    productsData.forEach(p => {
      if (p.brand) brandSet.add(p.brand);
    });
    return Array.from(brandSet);
  }, [productsData]);

  const filteredProducts = useMemo(() => {
    return productsData.filter((product) => {
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesBrand;
    });
  }, [productsData, brand]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("all");
    setBrand("all");
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numPrice);
  };

  const hasFilters = searchQuery || category !== "all" || brand !== "all";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="Lojamadrugadao" 
                className="h-10 w-10 rounded-full"
              />
              <div className="hidden sm:block">
                <h1 className="font-bold text-sm">LOJAMADRUGADAO</h1>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Phone className="h-3 w-3" />
                  <span>11 99294-0168</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setLocation("/")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-atacado-login"
              >
                <Store className="h-4 w-4 mr-2" />
                Atacado
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Catalogo</h2>
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} produtos disponiveis
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {brands.length > 0 && (
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-brand">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas marcas</SelectItem>
                {brands.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasFilters && (
            <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm">
              {hasFilters ? "Tente ajustar os filtros" : "Os produtos serao exibidos aqui quando forem cadastrados"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map(product => (
                <Card 
                  key={product.id}
                  className="overflow-hidden group hover-elevate transition-all duration-200"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="aspect-square bg-muted/30 flex items-center justify-center relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground/20" />
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                        <Badge variant="destructive">Indisponivel</Badge>
                      </div>
                    )}
                    {product.brand && (
                      <div className="absolute top-1.5 left-1.5">
                        <Badge variant="secondary" className="text-xs font-medium bg-background/90 backdrop-blur-sm">
                          {product.brand}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground mb-0.5 font-mono">
                      {product.sku}
                    </p>
                    <h3 className="font-medium text-xs line-clamp-2 min-h-[2rem] leading-tight mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold text-primary" data-testid={`text-price-${product.id}`}>
                      {formatPrice(product.price)}
                    </p>
                    {product.categoryId && categoryMap[product.categoryId] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {categoryMap[product.categoryId]}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Proxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Precos de varejo. Para precos de atacado, faca login.</p>
        </div>
      </footer>
    </div>
  );
}
