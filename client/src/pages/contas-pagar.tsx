import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AccountPayable, PayablePayment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDownRight,
  TrendingDown,
  Calendar,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Receipt,
  X,
  ChevronRight,
  Banknote,
  Building2,
  FileText
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PayablesDashboard {
  overview: {
    totalPayables: number;
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    payablesCount: number;
  };
  upcomingPayables: Array<{
    id: number;
    supplierName: string | null;
    category: string | null;
    description: string;
    amount: number;
    pendingAmount: number;
    dueDate: Date;
    daysUntilDue: number;
    status: string;
  }>;
  overduePayables: Array<{
    id: number;
    supplierName: string | null;
    category: string | null;
    description: string;
    amount: number;
    pendingAmount: number;
    dueDate: Date;
    daysUntilDue: number;
    status: string;
  }>;
  recentPayments: Array<{
    paymentId: number;
    payableId: number;
    supplierName: string | null;
    amount: number;
    paymentMethod: string | null;
    createdAt: Date;
  }>;
  byCategory: Array<{
    category: string;
    total: number;
    pending: number;
    count: number;
  }>;
}

const CATEGORIES = [
  "Fornecedor",
  "Aluguel",
  "Salario",
  "Imposto",
  "Energia",
  "Agua",
  "Internet",
  "Telefone",
  "Manutencao",
  "Marketing",
  "Outros"
];

const PAYMENT_METHODS = [
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartao" },
];

export default function ContasPagarPage() {
  const { isAdmin, isSales } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNewPayableModal, setShowNewPayableModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayableId, setSelectedPayableId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const showPage = isAdmin;

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<PayablesDashboard>({
    queryKey: ['/api/payables/dashboard'],
    enabled: showPage,
  });

  const { data: allPayables = [] } = useQuery<AccountPayable[]>({
    queryKey: ['/api/payables'],
    enabled: showPage,
  });

  const filteredPayables = categoryFilter === "all" 
    ? allPayables 
    : allPayables.filter(p => p.category === categoryFilter);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <Badge className="bg-green-500/20 text-green-600">Pago</Badge>;
      case 'VENCIDO':
        return <Badge className="bg-red-500/20 text-red-600">Vencido</Badge>;
      case 'PENDENTE':
        return <Badge className="bg-blue-500/20 text-blue-600">Pendente</Badge>;
      case 'CANCELADO':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!showPage) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Acesso nao autorizado</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Contas a Pagar</h1>
              <p className="text-sm text-muted-foreground">Gerenciamento de despesas e dividas</p>
            </div>
          </div>
          <Button onClick={() => setShowNewPayableModal(true)} data-testid="button-new-payable">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="bg-transparent h-12">
            <TabsTrigger value="dashboard" className="gap-2" data-testid="tab-payables-dashboard">
              <TrendingDown className="h-4 w-4" />
              Visao Geral
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2" data-testid="tab-payables-list">
              <FileText className="h-4 w-4" />
              Todas as Contas
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2" data-testid="tab-payables-upcoming">
              <Calendar className="h-4 w-4" />
              Vencimentos
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="dashboard" className="m-0 p-4">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : dashboard ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total a Pagar</p>
                          <p className="text-2xl font-bold text-red-500" data-testid="text-total-payable">
                            {formatPrice(dashboard.overview.totalPending)}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vencido</p>
                          <p className="text-2xl font-bold text-orange-500" data-testid="text-total-overdue-payable">
                            {formatPrice(dashboard.overview.totalOverdue)}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Pago</p>
                          <p className="text-2xl font-bold text-green-500" data-testid="text-total-paid-payable">
                            {formatPrice(dashboard.overview.totalPaid)}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Contas Ativas</p>
                          <p className="text-2xl font-bold" data-testid="text-payables-count">
                            {dashboard.overview.payablesCount}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Receipt className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {dashboard.byCategory && dashboard.byCategory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboard.byCategory.map((cat) => (
                          <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{cat.category}</Badge>
                              <span className="text-sm text-muted-foreground">{cat.count} contas</span>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(cat.pending)}</p>
                              <p className="text-xs text-muted-foreground">de {formatPrice(cat.total)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {dashboard.overduePayables && dashboard.overduePayables.length > 0 && (
                  <Card className="border-red-500/20">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Contas Vencidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dashboard.overduePayables.slice(0, 5).map((payable) => (
                          <div key={payable.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5">
                            <div>
                              <p className="font-medium">{payable.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {payable.supplierName || payable.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-red-500">{formatPrice(payable.pendingAmount)}</p>
                              <p className="text-xs text-red-500">
                                {Math.abs(payable.daysUntilDue)} dias atrasado
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Nenhum dado disponivel</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="m-0 p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredPayables.length === 0 ? (
                  <div className="text-center py-20">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhuma conta encontrada</p>
                  </div>
                ) : (
                  filteredPayables.map((payable) => {
                    const pending = parseFloat(payable.amount) - parseFloat(payable.paidAmount);
                    return (
                      <Card key={payable.id} className="hover-elevate">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{payable.description}</p>
                                {getStatusBadge(payable.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {payable.supplierName && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {payable.supplierName}
                                  </span>
                                )}
                                {payable.category && (
                                  <Badge variant="outline" className="text-xs">{payable.category}</Badge>
                                )}
                                {payable.dueDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(payable.dueDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(pending)}</p>
                              <p className="text-xs text-muted-foreground">
                                de {formatPrice(parseFloat(payable.amount))}
                              </p>
                            </div>
                            {payable.status !== 'PAGO' && payable.status !== 'CANCELADO' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-4"
                                onClick={() => {
                                  setSelectedPayableId(payable.id);
                                  setShowPaymentModal(true);
                                }}
                                data-testid={`button-pay-${payable.id}`}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="m-0 p-4">
            <div className="space-y-6">
              {dashboard?.upcomingPayables && dashboard.upcomingPayables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Proximos Vencimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboard.upcomingPayables.map((payable) => (
                        <div 
                          key={payable.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{payable.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {payable.supplierName || payable.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(payable.pendingAmount)}</p>
                            <p className="text-xs text-muted-foreground">
                              em {payable.daysUntilDue} dias
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {dashboard?.overduePayables && dashboard.overduePayables.length > 0 && (
                <Card className="border-red-500/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Contas Atrasadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashboard.overduePayables.map((payable) => (
                        <div 
                          key={payable.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-red-500/5"
                        >
                          <div>
                            <p className="font-medium">{payable.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {payable.supplierName || payable.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-500">{formatPrice(payable.pendingAmount)}</p>
                            <p className="text-xs text-red-500">
                              {Math.abs(payable.daysUntilDue)} dias atrasado
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(!dashboard?.upcomingPayables?.length && !dashboard?.overduePayables?.length) && (
                <div className="text-center py-20">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum vencimento programado</p>
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <NewPayableModal 
        open={showNewPayableModal} 
        onClose={() => setShowNewPayableModal(false)} 
      />

      <PaymentModal
        open={showPaymentModal}
        payableId={selectedPayableId}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPayableId(null);
        }}
      />
    </div>
  );
}

function NewPayableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    supplierName: "",
    category: "",
    description: "",
    amount: "",
    dueDate: "",
    documentNumber: "",
    notes: ""
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/payables', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payables/dashboard'] });
      toast({ title: "Conta criada com sucesso" });
      onClose();
      setFormData({
        supplierName: "",
        category: "",
        description: "",
        amount: "",
        dueDate: "",
        documentNumber: "",
        notes: ""
      });
    },
    onError: () => {
      toast({ title: "Erro ao criar conta", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      toast({ title: "Preencha os campos obrigatorios", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      ...formData,
      amount: formData.amount,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="Nome do fornecedor"
                data-testid="input-supplier-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descricao *</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descricao da conta"
              data-testid="input-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                data-testid="input-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                data-testid="input-due-date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Numero do Documento</Label>
            <Input
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
              placeholder="NF, Boleto, etc."
              data-testid="input-document-number"
            />
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observacoes adicionais"
              data-testid="input-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentModal({ 
  open, 
  payableId, 
  onClose 
}: { 
  open: boolean; 
  payableId: number | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const payMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/payables/${payableId}/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payables/dashboard'] });
      toast({ title: "Pagamento registrado com sucesso" });
      onClose();
      setAmount("");
      setPaymentMethod("");
      setNotes("");
    },
    onError: () => {
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    }
  });

  const handleSubmit = () => {
    if (!amount) {
      toast({ title: "Informe o valor do pagamento", variant: "destructive" });
      return;
    }

    payMutation.mutate({
      amount,
      paymentMethod,
      notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Valor *</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              data-testid="input-payment-amount"
            />
          </div>

          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observacoes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observacoes"
              data-testid="input-payment-notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={payMutation.isPending}>
            {payMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
