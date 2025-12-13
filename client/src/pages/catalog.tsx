import { useState, useMemo } from "react";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Package } from "lucide-react";
import type { Product } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import type { Product as SchemaProduct, Category } from "@shared/schema";

export default function CatalogPage() {
  const { addItem, openCart, itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");

  const { data: productsData = [], isLoading: productsLoading } = useQuery<SchemaProduct[]>({
    queryKey: ['/api/products'],
  });

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

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
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "all" || product.category === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchQuery, category, brand]);

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("all");
    setBrand("all");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Catálogo de Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Navegue por nossa seleção completa de produtos
          </p>
        </div>
        <Button onClick={openCart} className="gap-2" data-testid="button-view-cart">
          <ShoppingCart className="h-4 w-4" />
          Carrinho ({itemCount})
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredProducts.length} de {products.length} produtos
        </p>
      </div>

      {productsLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Nenhum produto disponível</h3>
          <p className="text-muted-foreground">
            Os produtos serão exibidos aqui quando forem cadastrados
          </p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
      )}
    </div>
  );
}
