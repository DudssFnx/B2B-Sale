import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Loader2, Package, ChevronLeft, ChevronRight, UserCheck, X } from "lucide-react";
import type { Product } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import type { Product as SchemaProduct, Category, User } from "@shared/schema";

interface ProductsResponse {
  products: SchemaProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CatalogPage() {
  const { addItem, openCart, itemCount, total, setSelectedCustomer } = useCart();
  const { isAdmin, isSales } = useAuth();
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const canSelectCustomer = isAdmin || isSales;

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: usersData = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: canSelectCustomer,
  });

  const customers = useMemo(() => {
    return usersData.filter(u => u.role === 'customer' && u.approved);
  }, [usersData]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (setSelectedCustomer) {
      setSelectedCustomer(selectedCustomerId ? {
        id: selectedCustomerId,
        name: selectedCustomer?.tradingName || selectedCustomer?.company || selectedCustomer?.firstName || selectedCustomer?.email || ""
      } : null);
    }
  }, [selectedCustomerId, selectedCustomer, setSelectedCustomer]);

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
    queryKey: ['/api/products', queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/products?${queryParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const productsData = productsResponse?.products || [];
  const totalProducts = productsResponse?.total || 0;
  const totalPages = productsResponse?.totalPages || 1;

  const categoryMap = useMemo(() => {
    const map: Record<number, string> = {};
    categoriesData.forEach(cat => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categoriesData]);

  const products: Product[] = useMemo(() => {
    return productsData.map((p) => ({
      id: String(p.id),
      name: p.name,
      sku: p.sku,
      category: p.categoryId ? categoryMap[p.categoryId] || "Sem categoria" : "Sem categoria",
      brand: p.brand || undefined,
      price: parseFloat(p.price),
      stock: p.stock,
      image: p.image || undefined,
    }));
  }, [productsData, categoryMap]);

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
    return products.filter((product) => {
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesBrand;
    });
  }, [products, brand]);

  const handleAddToCart = (product: Product, quantity: number) => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: quantity,
      image: product.image,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("all");
    setBrand("all");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {canSelectCustomer && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <UserCheck className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Criar pedido para cliente</p>
            <p className="text-xs text-muted-foreground">Selecione um cliente para criar pedido em nome dele</p>
          </div>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-[220px]" data-testid="select-customer">
              <SelectValue placeholder="Selecionar cliente..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.tradingName || c.company || c.firstName || c.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCustomerId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCustomerId("")}
              data-testid="button-clear-customer"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {selectedCustomer && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
          <Badge variant="outline" className="gap-1">
            <UserCheck className="h-3 w-3" />
            Pedido para: {selectedCustomer.tradingName || selectedCustomer.company || selectedCustomer.firstName || selectedCustomer.email}
          </Badge>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Catálogo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length} produtos disponíveis
          </p>
        </div>
        <Button onClick={openCart} className="gap-2" data-testid="button-view-cart">
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Carrinho</span>
          {itemCount > 0 && (
            <span className="bg-primary-foreground text-primary font-semibold px-2 py-0.5 rounded-full text-xs">
              {itemCount}
            </span>
          )}
        </Button>
      </div>

      <CatalogFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        brand={brand}
        onBrandChange={setBrand}
        categories={categories}
        brands={brands}
        onClearFilters={clearFilters}
      />

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          {filteredProducts.length === products.length 
            ? `${products.length} produtos` 
            : `${filteredProducts.length} de ${products.length} produtos`}
        </p>
        {itemCount > 0 && (
          <p className="text-muted-foreground">
            Total no carrinho: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
          </p>
        )}
      </div>

      {productsLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Package className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Nenhum produto disponível</h3>
          <p className="text-muted-foreground text-sm">
            Os produtos serão exibidos aqui quando forem cadastrados
          </p>
        </div>
      ) : (
        <>
          <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
          
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
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                data-testid="button-next-page"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
