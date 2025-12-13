import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Grid3X3, Box, Zap, Wrench, Coffee, Heart, Star, Bookmark, Layers, ShoppingBag } from "lucide-react";
import type { Category, Product } from "@shared/schema";

const categoryIcons: Record<string, typeof Package> = {
  eletronicos: Zap,
  ferramentas: Wrench,
  bebidas: Coffee,
  saude: Heart,
  destaques: Star,
  favoritos: Bookmark,
  diversos: Layers,
  default: Box,
};

const categoryColors: Record<string, string> = {
  eletronicos: "from-blue-500/20 to-blue-600/10",
  ferramentas: "from-orange-500/20 to-orange-600/10",
  bebidas: "from-amber-500/20 to-amber-600/10",
  saude: "from-rose-500/20 to-rose-600/10",
  destaques: "from-yellow-500/20 to-yellow-600/10",
  favoritos: "from-purple-500/20 to-purple-600/10",
  diversos: "from-emerald-500/20 to-emerald-600/10",
  default: "from-primary/20 to-primary/10",
};

const categoryIconColors: Record<string, string> = {
  eletronicos: "text-blue-500",
  ferramentas: "text-orange-500",
  bebidas: "text-amber-600",
  saude: "text-rose-500",
  destaques: "text-yellow-500",
  favoritos: "text-purple-500",
  diversos: "text-emerald-500",
  default: "text-primary",
};

function getCategoryIcon(slug: string) {
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z]/g, '');
  return categoryIcons[normalizedSlug] || categoryIcons.default;
}

function getCategoryColor(slug: string) {
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z]/g, '');
  return categoryColors[normalizedSlug] || categoryColors.default;
}

function getCategoryIconColor(slug: string) {
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z]/g, '');
  return categoryIconColors[normalizedSlug] || categoryIconColors.default;
}

export default function CategoriesPage() {
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['/api/products', { limit: 10000 }],
  });
  
  const productsData = productsResponse?.products || [];

  const categoriesWithCounts = useMemo(() => {
    const countMap: Record<number, number> = {};
    productsData.forEach((p) => {
      if (p.categoryId) {
        countMap[p.categoryId] = (countMap[p.categoryId] || 0) + 1;
      }
    });

    return categoriesData.map((cat) => ({
      ...cat,
      productCount: countMap[cat.id] || 0,
    }));
  }, [categoriesData, productsData]);

  const totalProducts = productsData.length;
  const isLoading = categoriesLoading || productsLoading;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Navegue por {categoriesData.length} categorias e {totalProducts} produtos
          </p>
        </div>
        <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" data-testid="link-view-all-products">
          <ShoppingBag className="h-4 w-4" />
          Ver todos os produtos
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      ) : categoriesData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Grid3X3 className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Nenhuma categoria cadastrada</h3>
          <p className="text-muted-foreground text-sm">
            As categorias serão exibidas aqui quando forem cadastradas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categoriesWithCounts.map((category) => {
            const Icon = getCategoryIcon(category.slug);
            const bgGradient = getCategoryColor(category.slug);
            const iconColor = getCategoryIconColor(category.slug);

            return (
              <Link key={category.id} href={`/catalog?category=${encodeURIComponent(category.name)}`} className="block" data-testid={`card-category-${category.id}`}>
                <Card className="group overflow-visible hover-elevate active-elevate-2 transition-all duration-200">
                  <CardContent className="p-0">
                    <div className={`relative h-32 bg-gradient-to-br ${bgGradient} rounded-t-lg overflow-hidden`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className={`h-16 w-16 ${iconColor} opacity-80 group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/20 to-transparent" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-base truncate">{category.name}</h3>
                        <Badge variant="secondary" className="shrink-0">
                          {category.productCount}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.productCount === 0 
                          ? "Nenhum produto" 
                          : category.productCount === 1 
                            ? "1 produto disponível" 
                            : `${category.productCount} produtos disponíveis`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          <Link href="/catalog" className="block" data-testid="card-all-products">
            <Card className="group overflow-visible hover-elevate active-elevate-2 transition-all duration-200 border-dashed">
              <CardContent className="p-0">
                <div className="relative h-32 bg-gradient-to-br from-muted/50 to-muted/30 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/60 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-base">Todos os Produtos</h3>
                    <Badge variant="outline" className="shrink-0">
                      {totalProducts}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ver catálogo completo
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {!isLoading && categoriesData.length > 0 && (
        <div className="mt-8">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary" data-testid="stat-total-categories">{categoriesData.length}</p>
                  <p className="text-xs text-muted-foreground">Categorias</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-total-products">{totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-active-categories">
                    {categoriesWithCounts.filter(c => c.productCount > 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Com Produtos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground" data-testid="stat-empty-categories">
                    {categoriesWithCounts.filter(c => c.productCount === 0).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Sem Produtos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
