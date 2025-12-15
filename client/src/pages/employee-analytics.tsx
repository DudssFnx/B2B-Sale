import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Loader2, 
  Users, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ClipboardList,
  Crown,
  Award
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EmployeeMetrics {
  userId: string;
  name: string;
  email: string | null;
  role: string;
  totalOrders: number;
  totalRevenue: number;
  avgTicket: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  ordersThisQuarter: number;
  revenueThisQuarter: number;
  lastActivity: string | null;
}

interface EmployeeAnalyticsData {
  employees: EmployeeMetrics[];
  overview: {
    totalEmployees: number;
    totalOrdersThisMonth: number;
    totalRevenueThisMonth: number;
    avgOrdersPerEmployee: number;
    topPerformer: string | null;
  };
  periodComparison: {
    thisMonth: { orders: number; revenue: number };
    lastMonth: { orders: number; revenue: number };
    thisQuarter: { orders: number; revenue: number };
    lastQuarter: { orders: number; revenue: number };
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(dateStr));
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    sales: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };
  const labels: Record<string, string> = {
    admin: 'Admin',
    sales: 'Vendedor',
  };
  return <Badge className={styles[role] || 'bg-muted'}>{labels[role] || role}</Badge>;
}

function GrowthIndicator({ current, previous, type = 'number' }: { current: number; previous: number; type?: 'number' | 'currency' }) {
  if (previous === 0) return null;
  const growth = ((current - previous) / previous) * 100;
  const isPositive = growth >= 0;
  
  return (
    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>{isPositive ? '+' : ''}{growth.toFixed(1)}%</span>
    </div>
  );
}

export default function EmployeeAnalyticsPage() {
  const { data: analytics, isLoading, refetch } = useQuery<EmployeeAnalyticsData>({
    queryKey: ['/api/admin/employee-analytics'],
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" data-testid="text-page-title">Analise de Funcionarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Metricas de desempenho da equipe (baseado em pedidos faturados)
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-analytics">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-total-employees">
                      {analytics?.overview.totalEmployees || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Funcionarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <ClipboardList className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-orders-month">
                      {analytics?.overview.totalOrdersThisMonth || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Pedidos no Mes</p>
                    <GrowthIndicator 
                      current={analytics?.periodComparison.thisMonth.orders || 0} 
                      previous={analytics?.periodComparison.lastMonth.orders || 0} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold" data-testid="stat-revenue-month">
                      {formatCurrency(analytics?.overview.totalRevenueThisMonth || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Faturamento Mes</p>
                    <GrowthIndicator 
                      current={analytics?.periodComparison.thisMonth.revenue || 0} 
                      previous={analytics?.periodComparison.lastMonth.revenue || 0} 
                      type="currency"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-avg-orders">
                      {analytics?.overview.avgOrdersPerEmployee || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Media/Funcionario</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Crown className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate" data-testid="stat-top-performer">
                      {analytics?.overview.topPerformer || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Top Performer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Comparativo Mensal</CardTitle>
                <CardDescription>Este mes vs mes anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Este Mes</p>
                    <p className="text-2xl font-bold" data-testid="stat-this-month-orders">{analytics?.periodComparison.thisMonth.orders || 0}</p>
                    <p className="text-sm" data-testid="stat-this-month-revenue">{formatCurrency(analytics?.periodComparison.thisMonth.revenue || 0)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Mes Anterior</p>
                    <p className="text-2xl font-bold" data-testid="stat-last-month-orders">{analytics?.periodComparison.lastMonth.orders || 0}</p>
                    <p className="text-sm" data-testid="stat-last-month-revenue">{formatCurrency(analytics?.periodComparison.lastMonth.revenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Comparativo Trimestral</CardTitle>
                <CardDescription>Este trimestre vs trimestre anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Este Trimestre</p>
                    <p className="text-2xl font-bold" data-testid="stat-this-quarter-orders">{analytics?.periodComparison.thisQuarter.orders || 0}</p>
                    <p className="text-sm" data-testid="stat-this-quarter-revenue">{formatCurrency(analytics?.periodComparison.thisQuarter.revenue || 0)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Trimestre Anterior</p>
                    <p className="text-2xl font-bold" data-testid="stat-last-quarter-orders">{analytics?.periodComparison.lastQuarter.orders || 0}</p>
                    <p className="text-sm" data-testid="stat-last-quarter-revenue">{formatCurrency(analytics?.periodComparison.lastQuarter.revenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Ranking de Funcionarios</CardTitle>
              </div>
              <CardDescription>Ordenado por faturamento no mes atual</CardDescription>
            </CardHeader>
            <CardContent>
              {(!analytics?.employees || analytics.employees.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-employees-message">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum funcionario encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-employees-ranking">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">#</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Funcionario</th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">Cargo</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Pedidos Mes</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Faturamento Mes</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total Pedidos</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total Faturamento</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ticket Medio</th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ultima Atividade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.employees.map((employee, idx) => (
                        <tr key={employee.userId} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-employee-${employee.userId}`}>
                          <td className="py-3 px-2">
                            {idx < 3 ? (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                idx === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                                idx === 1 ? 'bg-gray-400/20 text-gray-600' :
                                'bg-orange-500/20 text-orange-600'
                              }`}>
                                {idx + 1}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              {employee.email && (
                                <p className="text-xs text-muted-foreground">{employee.email}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <RoleBadge role={employee.role} />
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{employee.ordersThisMonth}</td>
                          <td className="py-3 px-2 text-right font-medium">{formatCurrency(employee.revenueThisMonth)}</td>
                          <td className="py-3 px-2 text-right">{employee.totalOrders}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(employee.totalRevenue)}</td>
                          <td className="py-3 px-2 text-right">{formatCurrency(employee.avgTicket)}</td>
                          <td className="py-3 px-2 text-right">{formatDate(employee.lastActivity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
