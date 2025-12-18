import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, TrendingUp, AlertTriangle, ShoppingCart, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";

interface BrandSummary {
  brand: string;
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalSales30d: number;
  totalRevenue30d: number;
  avgTurnover: number;
}

interface BrandProductDetail {
  productId: number;
  name: string;
  sku: string;
  brand: string;
  stock: number;
  sales30d: number;
  sales60d: number;
  sales90d: number;
  revenue30d: number;
  lastSaleDate: string | null;
  turnoverDays: number | null;
  status: 'critical' | 'low' | 'ok' | 'overstock';
  suggestedPurchase: number;
}

interface BrandAnalyticsData {
  brands: BrandSummary[];
  productsByBrand: Record<string, BrandProductDetail[]>;
  overview: {
    totalBrands: number;
    totalProducts: number;
    totalLowStock: number;
    totalOutOfStock: number;
    topSellingBrand: string | null;
    topSellingBrandRevenue: number;
  };
}

const statusColors = {
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  low: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  ok: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  overstock: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const statusLabels = {
  critical: 'Critico',
  low: 'Baixo',
  ok: 'OK',
  overstock: 'Excesso',
};

export default function BrandAnalyticsPage() {
  const { isSupplier, user } = useAuth();
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<BrandAnalyticsData>({
    queryKey: ['/api/admin/brand-analytics'],
  });

  const toggleBrandExpansion = (brand: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-muted-foreground">Erro ao carregar dados de marcas.</p>
      </div>
    );
  }

  const filteredBrands = selectedBrand === "all" 
    ? data.brands 
    : data.brands.filter(b => b.brand === selectedBrand);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics por Marca</h1>
          <p className="text-muted-foreground mt-1">
            {isSupplier 
              ? `Visualizacao de suas marcas: ${user?.allowedBrands?.join(', ') || 'Nenhuma'}`
              : 'Analise de desempenho e estoque por marca'
            }
          </p>
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-[200px]" data-testid="select-brand-filter">
            <SelectValue placeholder="Filtrar por marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            {data.brands.map(b => (
              <SelectItem key={b.brand} value={b.brand}>{b.brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total de Marcas"
          value={data.overview.totalBrands}
          icon={Tag}
          data-testid="stat-total-brands"
        />
        <StatCard
          title="Total de Produtos"
          value={data.overview.totalProducts}
          icon={Package}
          data-testid="stat-total-products"
        />
        <StatCard
          title="Estoque Baixo"
          value={data.overview.totalLowStock}
          icon={AlertTriangle}
          data-testid="stat-low-stock"
        />
        <StatCard
          title="Sem Estoque"
          value={data.overview.totalOutOfStock}
          icon={AlertTriangle}
          data-testid="stat-out-of-stock"
        />
        {!isSupplier && (
          <StatCard
            title="Marca Top"
            value={data.overview.topSellingBrand || '-'}
            icon={TrendingUp}
            data-testid="stat-top-brand"
          />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Desempenho por Marca</h2>
        
        {filteredBrands.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Nenhuma marca encontrada.</p>
            </CardContent>
          </Card>
        ) : (
          filteredBrands.map(brand => (
            <Collapsible 
              key={brand.brand}
              open={expandedBrands.has(brand.brand)}
              onOpenChange={() => toggleBrandExpansion(brand.brand)}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent" data-testid={`brand-toggle-${brand.brand}`}>
                      <div className="flex items-center gap-4">
                        {expandedBrands.has(brand.brand) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-lg">{brand.brand}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{brand.totalProducts} produtos</Badge>
                          {brand.outOfStockCount > 0 && (
                            <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
                              {brand.outOfStockCount} sem estoque
                            </Badge>
                          )}
                          {brand.lowStockCount > 0 && (
                            <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">
                              {brand.lowStockCount} baixo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <span className="text-muted-foreground">Estoque:</span>
                          <span className="ml-2 font-semibold">{brand.totalStock}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground">Vendas 30d:</span>
                          <span className="ml-2 font-semibold">{brand.totalSales30d}</span>
                        </div>
                        {!isSupplier && (
                          <div className="text-right">
                            <span className="text-muted-foreground">Receita 30d:</span>
                            <span className="ml-2 font-semibold">
                              R$ {brand.totalRevenue30d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-muted-foreground">Giro medio:</span>
                          <span className="ml-2 font-semibold">
                            {brand.avgTurnover > 0 ? `${brand.avgTurnover} dias` : '-'}
                          </span>
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                        <div className="col-span-3">Produto</div>
                        <div className="col-span-1 text-center">SKU</div>
                        <div className="col-span-1 text-center">Estoque</div>
                        <div className="col-span-1 text-center">30d</div>
                        <div className="col-span-1 text-center">60d</div>
                        <div className="col-span-1 text-center">90d</div>
                        <div className="col-span-1 text-center">Giro</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-2 text-center">Sugestao Compra</div>
                      </div>
                      {(data.productsByBrand[brand.brand] || []).map(product => (
                        <div 
                          key={product.productId}
                          className="grid grid-cols-12 gap-4 text-sm items-center py-2 hover-elevate rounded-md px-2"
                          data-testid={`product-row-${product.productId}`}
                        >
                          <div className="col-span-3 font-medium truncate" title={product.name}>
                            {product.name}
                          </div>
                          <div className="col-span-1 text-center">
                            <Badge variant="outline" className="text-xs">{product.sku}</Badge>
                          </div>
                          <div className="col-span-1 text-center font-semibold">
                            {product.stock}
                          </div>
                          <div className="col-span-1 text-center">
                            {product.sales30d}
                          </div>
                          <div className="col-span-1 text-center">
                            {product.sales60d}
                          </div>
                          <div className="col-span-1 text-center">
                            {product.sales90d}
                          </div>
                          <div className="col-span-1 text-center">
                            {product.turnoverDays !== null ? `${product.turnoverDays}d` : '-'}
                          </div>
                          <div className="col-span-1 text-center">
                            <Badge className={statusColors[product.status]}>
                              {statusLabels[product.status]}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-center">
                            {product.suggestedPurchase > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold text-primary">{product.suggestedPurchase} un.</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}
