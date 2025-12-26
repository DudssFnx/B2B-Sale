import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  ShoppingCart,
  DollarSign,
  ExternalLink,
  LogIn,
  Settings,
  Search,
  Loader2,
  TrendingUp,
  Activity,
  CheckCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

interface GlobalMetrics {
  totalCompanies: number;
  activeCompanies: number;
  totalOrders: number;
  totalRevenue: number;
}

interface CompanyWithStats {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  slug: string;
  cnpj: string;
  tipoCliente: string;
  approvalStatus: string;
  ativo: boolean;
  cidade: string | null;
  estado: string | null;
  email: string | null;
  telefone: string | null;
  createdAt: string;
  orderCount: number;
  totalRevenue: number;
  lastActivity: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`metric-${title.toLowerCase().replace(/\s/g, '-')}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, ativo }: { status: string; ativo: boolean }) {
  if (!ativo) {
    return <Badge variant="secondary">Inativo</Badge>;
  }
  
  switch (status) {
    case "APROVADO":
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Aprovado</Badge>;
    case "PENDENTE":
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Pendente</Badge>;
    case "REPROVADO":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Reprovado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function SuperAdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: metrics, isLoading: metricsLoading } = useQuery<GlobalMetrics>({
    queryKey: ["/api/superadmin/metrics"],
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<CompanyWithStats[]>({
    queryKey: ["/api/superadmin/companies"],
  });

  const impersonateMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await apiRequest("POST", `/api/superadmin/impersonate/${companyId}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Modo empresa ativado",
        description: `Você está atuando como ${data.company.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/impersonation-status"] });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível entrar como empresa",
        variant: "destructive",
      });
    },
  });

  const filteredCompanies = companies.filter((company) => {
    const search = searchQuery.toLowerCase();
    return (
      company.nomeFantasia?.toLowerCase().includes(search) ||
      company.razaoSocial.toLowerCase().includes(search) ||
      company.slug.toLowerCase().includes(search) ||
      company.cnpj?.includes(search)
    );
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (metricsLoading || companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma SaaS
          </p>
        </div>
        <Badge variant="outline" className="text-sm py-1 px-3">
          <Activity className="h-3 w-3 mr-1" />
          SUPER ADMIN
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Empresas"
          value={metrics?.totalCompanies ?? 0}
          icon={Building2}
          subtitle="Empresas cadastradas"
        />
        <MetricCard
          title="Empresas Ativas"
          value={metrics?.activeCompanies ?? 0}
          icon={CheckCircle}
          subtitle={`${metrics?.totalCompanies ? Math.round((metrics.activeCompanies / metrics.totalCompanies) * 100) : 0}% do total`}
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics?.totalOrders ?? 0}
          icon={ShoppingCart}
          subtitle="Pedidos na plataforma"
        />
        <MetricCard
          title="Faturamento Total"
          value={formatCurrency(metrics?.totalRevenue ?? 0)}
          icon={DollarSign}
          subtitle="Receita da plataforma"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Empresas Cadastradas
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-companies"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {company.nomeFantasia || company.razaoSocial}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {company.cidade && company.estado
                            ? `${company.cidade}, ${company.estado}`
                            : company.cnpj}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {company.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={company.approvalStatus} ativo={company.ativo} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {company.tipoCliente}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {company.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(company.totalRevenue)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {company.lastActivity
                          ? formatDistanceToNow(new Date(company.lastActivity), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : "Sem atividade"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => impersonateMutation.mutate(company.id)}
                          disabled={impersonateMutation.isPending}
                          title="Entrar como empresa"
                          data-testid={`button-impersonate-${company.id}`}
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/loja/${company.slug}`, "_blank")}
                          title="Abrir loja pública"
                          data-testid={`button-store-${company.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            impersonateMutation.mutate(company.id);
                            setTimeout(() => setLocation("/settings"), 500);
                          }}
                          title="Configurar empresa"
                          data-testid={`button-settings-${company.id}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
