import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle, XCircle, RefreshCw, Link as LinkIcon, FolderSync, Package, Unlink, Clock, AlertCircle, Download, Search } from "lucide-react";

interface BlingStatus {
  authenticated: boolean;
  hasCredentials: boolean;
}

interface SyncResult {
  created: number;
  updated: number;
  errors?: string[];
}

interface SyncProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  phase: string;
  currentStep: number;
  totalSteps: number;
  message: string;
  created: number;
  updated: number;
  errors: number;
  startTime: number | null;
  estimatedRemaining: string | null;
}

interface BlingCategory {
  id: number;
  descricao: string;
  categoriaPai?: { id: number };
}

interface BlingProduct {
  id: number;
  nome: string;
  codigo: string;
  preco: number;
  situacao: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function BlingPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [blingCategories, setBlingCategories] = useState<BlingCategory[]>([]);
  const [blingProducts, setBlingProducts] = useState<BlingProduct[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const { data: status, isLoading } = useQuery<BlingStatus>({
    queryKey: ["/api/bling/status"],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Conectado ao Bling",
        description: "Sua conta Bling foi conectada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bling/status"] });
      window.history.replaceState({}, "", "/bling");
    } else if (params.get("error") === "auth_failed") {
      toast({
        title: "Falha na Conexão",
        description: "Falha ao conectar ao Bling. Por favor, tente novamente.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/bling");
    }
  }, [location, toast]);

  useEffect(() => {
    if (status?.authenticated) {
      const eventSource = new EventSource("/api/bling/sync/progress", { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const progress: SyncProgress = JSON.parse(event.data);
          setSyncProgress(progress);
          
          if (progress.status === 'completed') {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({
              title: "Sincronização Concluída",
              description: `${progress.created} criados, ${progress.updated} atualizados${progress.errors > 0 ? `, ${progress.errors} erros` : ''}`,
            });
          }
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [status?.authenticated, toast]);

  const syncCategoriesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bling/sync/categories");
      return response.json();
    },
    onSuccess: (data: SyncResult) => {
      toast({
        title: "Categorias Sincronizadas",
        description: `Criadas: ${data.created}, Atualizadas: ${data.updated}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      toast({
        title: "Falha na Sincronização",
        description: error.message || "Falha ao sincronizar categorias",
        variant: "destructive",
      });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bling/sync/products");
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Falha na Sincronização",
        description: error.message || "Falha ao sincronizar produtos",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bling/disconnect");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Desconectado",
        description: "Sua conta Bling foi desconectada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bling/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao desconectar",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    window.location.href = "/api/bling/auth";
  };

  const loadBlingCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await apiRequest("GET", "/api/bling/categories/preview");
      const data = await response.json();
      setBlingCategories(data.categories || []);
      setSelectedCategories([]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message || "Falha ao buscar categorias do Bling",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadBlingProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await apiRequest("GET", "/api/bling/products/preview");
      const data = await response.json();
      setBlingProducts(data.products || []);
      setSelectedProducts([]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message || "Falha ao buscar produtos do Bling",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const importCategoriesMutation = useMutation({
    mutationFn: async (categoryIds: number[]) => {
      const response = await apiRequest("POST", "/api/bling/categories/import", { categoryIds });
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      toast({
        title: "Categorias importadas",
        description: `${data.imported} importadas, ${data.skipped} já existentes`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setSelectedCategories([]);
      loadBlingCategories();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao importar categorias",
        description: error.message || "Falha ao importar categorias selecionadas",
        variant: "destructive",
      });
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const response = await apiRequest("POST", "/api/bling/products/import", { productIds });
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      toast({
        title: "Produtos importados",
        description: `${data.imported} importados, ${data.skipped} já existentes`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setSelectedProducts([]);
      loadBlingProducts();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao importar produtos",
        description: error.message || "Falha ao importar produtos selecionados",
        variant: "destructive",
      });
    },
  });

  const toggleCategorySelection = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === blingCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(blingCategories.map(c => c.id));
    }
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === blingProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(blingProducts.map(p => p.id));
    }
  };

  const isSyncing = syncProgress?.status === 'running';
  const progressPercent = syncProgress && syncProgress.totalSteps > 0 
    ? Math.round((syncProgress.currentStep / syncProgress.totalSteps) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-bling-title">Integração Bling</h1>
        <p className="text-muted-foreground">
          Conecte sua conta Bling para sincronizar produtos e categorias.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
          <CardDescription>
            Status da sua conexão com a API Bling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Credenciais:</span>
              {status?.hasCredentials ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Configuradas
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Ausentes
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Autenticação:</span>
              {status?.authenticated ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Não Conectado
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {status?.hasCredentials && !status?.authenticated && (
              <Button onClick={handleConnect} data-testid="button-bling-connect">
                <LinkIcon className="h-4 w-4 mr-2" />
                Conectar ao Bling
              </Button>
            )}

            {status?.authenticated && (
              <Button 
                variant="destructive" 
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                data-testid="button-bling-disconnect"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4 mr-2" />
                )}
                Desconectar
              </Button>
            )}
          </div>

          {!status?.hasCredentials && (
            <p className="text-sm text-muted-foreground">
              Por favor, configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no seu ambiente.
            </p>
          )}
        </CardContent>
      </Card>

      {status?.authenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sincronização
            </CardTitle>
            <CardDescription>
              Sincronize dados do Bling para seu catálogo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => syncCategoriesMutation.mutate()}
                disabled={syncCategoriesMutation.isPending || isSyncing}
                variant="outline"
                data-testid="button-sync-categories"
              >
                {syncCategoriesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FolderSync className="h-4 w-4 mr-2" />
                )}
                Sincronizar Categorias
              </Button>

              <Button
                onClick={() => syncProductsMutation.mutate()}
                disabled={syncProductsMutation.isPending || isSyncing}
                data-testid="button-sync-products"
              >
                {(syncProductsMutation.isPending || isSyncing) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Package className="h-4 w-4 mr-2" />
                )}
                Sincronizar Produtos
              </Button>
            </div>

            {isSyncing && syncProgress && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-md" data-testid="sync-progress-container">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="font-medium text-sm">{syncProgress.phase}</span>
                  </div>
                  {syncProgress.estimatedRemaining && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>~{syncProgress.estimatedRemaining}</span>
                    </div>
                  )}
                </div>
                
                <Progress value={progressPercent} className="h-2" data-testid="sync-progress-bar" />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{syncProgress.message}</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{syncProgress.created} novos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 text-blue-500" />
                    <span>{syncProgress.updated} atualizados</span>
                  </div>
                  {syncProgress.errors > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-destructive" />
                      <span>{syncProgress.errors} erros</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {syncProgress?.status === 'completed' && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md" data-testid="sync-completed">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{syncProgress.message}</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {syncProgress.created} produtos criados, {syncProgress.updated} atualizados
                  {syncProgress.errors > 0 && `, ${syncProgress.errors} erros`}
                </div>
              </div>
            )}

            {syncProgress?.status === 'error' && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md" data-testid="sync-error">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{syncProgress.message}</span>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              A sincronização irá importar ou atualizar categorias e produtos da sua conta Bling.
            </p>
          </CardContent>
        </Card>
      )}

      {status?.authenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importação Manual
            </CardTitle>
            <CardDescription>
              Selecione categorias e produtos específicos para importar do Bling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="categories" data-testid="tab-categories">
                  <FolderSync className="h-4 w-4 mr-2" />
                  Categorias
                </TabsTrigger>
                <TabsTrigger value="products" data-testid="tab-products">
                  <Package className="h-4 w-4 mr-2" />
                  Produtos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={loadBlingCategories}
                    disabled={loadingCategories}
                    data-testid="button-load-categories"
                  >
                    {loadingCategories ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Carregar Categorias
                  </Button>
                  {blingCategories.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllCategories}
                        data-testid="button-select-all-categories"
                      >
                        {selectedCategories.length === blingCategories.length ? "Desmarcar Tudo" : "Selecionar Tudo"}
                      </Button>
                      <Badge variant="secondary">
                        {selectedCategories.length} de {blingCategories.length} selecionadas
                      </Badge>
                    </>
                  )}
                </div>

                {blingCategories.length > 0 && (
                  <ScrollArea className="h-64 border rounded-md p-3">
                    <div className="space-y-2">
                      {blingCategories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                          data-testid={`category-item-${category.id}`}
                        >
                          <Checkbox
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => toggleCategorySelection(category.id)}
                            data-testid={`checkbox-category-${category.id}`}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">{category.descricao}</span>
                            {category.categoriaPai && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Subcategoria)
                              </span>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ID: {category.id}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {blingCategories.length > 0 && (
                  <Button
                    onClick={() => importCategoriesMutation.mutate(selectedCategories)}
                    disabled={selectedCategories.length === 0 || importCategoriesMutation.isPending}
                    data-testid="button-import-categories"
                  >
                    {importCategoriesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Importar {selectedCategories.length} Categoria{selectedCategories.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={loadBlingProducts}
                    disabled={loadingProducts}
                    data-testid="button-load-products"
                  >
                    {loadingProducts ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Carregar Produtos
                  </Button>
                  {blingProducts.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllProducts}
                        data-testid="button-select-all-products"
                      >
                        {selectedProducts.length === blingProducts.length ? "Desmarcar Tudo" : "Selecionar Tudo"}
                      </Button>
                      <Badge variant="secondary">
                        {selectedProducts.length} de {blingProducts.length} selecionados
                      </Badge>
                    </>
                  )}
                </div>

                {blingProducts.length > 0 && (
                  <ScrollArea className="h-64 border rounded-md p-3">
                    <div className="space-y-2">
                      {blingProducts.map((product) => (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                          data-testid={`product-item-${product.id}`}
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                            data-testid={`checkbox-product-${product.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{product.nome}</div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                              <span>SKU: {product.codigo}</span>
                              <span>R$ {product.preco?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                          <Badge variant={product.situacao === 'A' ? 'default' : 'secondary'} className="text-xs">
                            {product.situacao === 'A' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {blingProducts.length > 0 && (
                  <Button
                    onClick={() => importProductsMutation.mutate(selectedProducts)}
                    disabled={selectedProducts.length === 0 || importProductsMutation.isPending}
                    data-testid="button-import-products"
                  >
                    {importProductsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Importar {selectedProducts.length} Produto{selectedProducts.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
