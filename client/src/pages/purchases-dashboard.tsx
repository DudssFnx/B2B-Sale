import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, TrendingDown, TrendingUp, ShoppingCart, Package, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/StatCard";

interface LowStockProduct {
  productId: number;
  name: string;
  sku: string;
  categoryName: string | null;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  avgDailySales: number;
  daysOfStock: number;
  suggestedPurchaseQty: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

interface SlowMovingProduct {
  productId: number;
  name: string;
  sku: string;
  categoryName: string | null;
  currentStock: number;
  stockValue: number;
  daysSinceLastSale: number;
  totalSalesLast90Days: number;
  avgDailySales: number;
  recommendation: string;
}

interface FastMovingProduct {
  productId: number;
  name: string;
  sku: string;
  categoryName: string | null;
  currentStock: number;
  avgDailySales: number;
  daysOfStock: number;
  salesLast30Days: number;
  growthPercent: number;
  suggestedPurchaseQty: number;
}

interface PurchaseSuggestion {
  productId: number;
  name: string;
  sku: string;
  categoryName: string | null;
  currentStock: number;
  suggestedQty: number;
  estimatedCost: number;
  reason: string;
  priority: 'urgent' | 'high' | 'normal';
}

interface PurchasesAnalyticsData {
  overview: {
    totalLowStockProducts: number;
    totalSlowMovingProducts: number;
    totalFastMovingProducts: number;
    estimatedPurchaseValue: number;
    criticalItems: number;
  };
  lowStock: LowStockProduct[];
  slowMoving: SlowMovingProduct[];
  fastMoving: FastMovingProduct[];
  suggestions: PurchaseSuggestion[];
}

const urgencyColors = {
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

const priorityColors = {
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  normal: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

export default function PurchasesDashboardPage() {
  const { data, isLoading } = useQuery<PurchasesAnalyticsData>({
    queryKey: ['/api/admin/purchases-analytics'],
  });

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
        <p className="text-muted-foreground">Erro ao carregar dados de compras.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Painel de Compras</h1>
        <p className="text-muted-foreground mt-1">Analise de estoque e sugestoes de reposicao</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Estoque Baixo"
          value={data.overview.totalLowStockProducts}
          icon={AlertTriangle}
          data-testid="stat-low-stock"
        />
        <StatCard
          title="Itens Criticos"
          value={data.overview.criticalItems}
          icon={AlertTriangle}
          data-testid="stat-critical-items"
        />
        <StatCard
          title="Giro Lento"
          value={data.overview.totalSlowMovingProducts}
          icon={TrendingDown}
          data-testid="stat-slow-moving"
        />
        <StatCard
          title="Giro Rapido"
          value={data.overview.totalFastMovingProducts}
          icon={TrendingUp}
          data-testid="stat-fast-moving"
        />
        <StatCard
          title="Custo Est. Compra"
          value={`R$ ${(data.overview.estimatedPurchaseValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          data-testid="stat-estimated-cost"
        />
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suggestions" data-testid="tab-suggestions">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sugestoes
          </TabsTrigger>
          <TabsTrigger value="low-stock" data-testid="tab-low-stock">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Estoque Baixo
          </TabsTrigger>
          <TabsTrigger value="slow-moving" data-testid="tab-slow-moving">
            <TrendingDown className="h-4 w-4 mr-2" />
            Giro Lento
          </TabsTrigger>
          <TabsTrigger value="fast-moving" data-testid="tab-fast-moving">
            <TrendingUp className="h-4 w-4 mr-2" />
            Giro Rapido
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                Sugestoes Inteligentes de Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.suggestions.length === 0 ? (
                <p className="text-muted-foreground py-4">Nenhuma sugestao de compra no momento.</p>
              ) : (
                <div className="space-y-3">
                  {data.suggestions.map((item) => (
                    <div 
                      key={item.productId} 
                      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-muted/50"
                      data-testid={`suggestion-${item.productId}`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                          <Badge className={priorityColors[item.priority]}>
                            {item.priority === 'urgent' ? 'Urgente' : item.priority === 'high' ? 'Alta' : 'Normal'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                        {item.categoryName && (
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Estoque: <span className="font-semibold">{item.currentStock}</span></p>
                        <p className="text-sm">Sugerido: <span className="font-semibold text-primary">{item.suggestedQty} un.</span></p>
                        <p className="text-sm text-muted-foreground">Est.: R$ {(item.estimatedCost ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                Produtos com Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.lowStock.length === 0 ? (
                <p className="text-muted-foreground py-4">Nenhum produto com estoque baixo.</p>
              ) : (
                <div className="space-y-3">
                  {data.lowStock.map((item) => (
                    <div 
                      key={item.productId} 
                      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-muted/50"
                      data-testid={`low-stock-${item.productId}`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                          <Badge className={urgencyColors[item.urgency]}>
                            {item.urgency === 'critical' ? 'Critico' : 
                             item.urgency === 'high' ? 'Alto' : 
                             item.urgency === 'medium' ? 'Medio' : 'Baixo'}
                          </Badge>
                        </div>
                        {item.categoryName && (
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Estoque</p>
                          <p className="font-semibold">{item.currentStock}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Disponivel</p>
                          <p className="font-semibold">{item.availableStock}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dias Rest.</p>
                          <p className="font-semibold">{item.daysOfStock}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Comprar</p>
                          <p className="font-semibold text-primary">{item.suggestedPurchaseQty} un.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slow-moving" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
                Produtos com Giro Lento (para queimar)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.slowMoving.length === 0 ? (
                <p className="text-muted-foreground py-4">Nenhum produto com giro lento.</p>
              ) : (
                <div className="space-y-3">
                  {data.slowMoving.map((item) => (
                    <div 
                      key={item.productId} 
                      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-muted/50"
                      data-testid={`slow-moving-${item.productId}`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                        </div>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{item.recommendation}</p>
                        {item.categoryName && (
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Estoque</p>
                          <p className="font-semibold">{item.currentStock}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Est.</p>
                          <p className="font-semibold">R$ {(item.stockValue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dias s/ Venda</p>
                          <p className="font-semibold">{item.daysSinceLastSale}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vendas 90d</p>
                          <p className="font-semibold">{item.totalSalesLast90Days}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fast-moving" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Produtos com Giro Rapido (precisa repor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.fastMoving.length === 0 ? (
                <p className="text-muted-foreground py-4">Nenhum produto com giro rapido identificado.</p>
              ) : (
                <div className="space-y-3">
                  {data.fastMoving.map((item) => (
                    <div 
                      key={item.productId} 
                      className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md bg-muted/50"
                      data-testid={`fast-moving-${item.productId}`}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="text-xs">{item.sku}</Badge>
                          {item.growthPercent > 0 && (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                              +{item.growthPercent}%
                            </Badge>
                          )}
                        </div>
                        {item.categoryName && (
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Estoque</p>
                          <p className="font-semibold">{item.currentStock}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vendas/dia</p>
                          <p className="font-semibold">{item.avgDailySales}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vendas 30d</p>
                          <p className="font-semibold">{item.salesLast30Days}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Comprar</p>
                          <p className="font-semibold text-primary">{item.suggestedPurchaseQty} un.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
