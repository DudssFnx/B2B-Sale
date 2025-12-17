import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Copy, 
  Star,
  ArrowLeft,
  Package,
  DollarSign,
  Boxes,
  Save,
  Ruler
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product as SchemaProduct, Category } from "@shared/schema";

interface ProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: number | null;
  brand: string;
  price: number;
  cost: number | null;
  stock: number;
  description: string | null;
  image: string | null;
  images: string[] | null;
  featured: boolean;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
}

const productSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  sku: z.string().min(1, "SKU e obrigatorio"),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  price: z.coerce.number().min(0, "Preco deve ser positivo"),
  cost: z.coerce.number().min(0, "Custo deve ser positivo").optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0, "Estoque deve ser 0 ou mais"),
  description: z.string().optional(),
  featured: z.boolean().default(false),
  weight: z.coerce.number().min(0, "Peso deve ser positivo").optional().or(z.literal("")),
  width: z.coerce.number().min(0, "Largura deve ser positiva").optional().or(z.literal("")),
  height: z.coerce.number().min(0, "Altura deve ser positiva").optional().or(z.literal("")),
  depth: z.coerce.number().min(0, "Profundidade deve ser positiva").optional().or(z.literal("")),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState("dados");
  const MAX_IMAGES = 5;

  const { data: productsResponse, isLoading } = useQuery<{ products: SchemaProduct[]; total: number }>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=10000', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });
  
  const productsData = productsResponse?.products || [];

  const { data: categoriesResponse } = useQuery<{ categories: Category[]; total: number }>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories?limit=1000', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });
  
  const categoriesData = categoriesResponse?.categories || [];

  const categoryMap: Record<number, string> = {};
  categoriesData.forEach(cat => {
    categoryMap[cat.id] = cat.name;
  });

  const products: ProductData[] = productsData.map((p) => ({
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    category: p.categoryId ? categoryMap[p.categoryId] || "Sem categoria" : "Sem categoria",
    categoryId: p.categoryId,
    brand: p.brand || "",
    price: parseFloat(p.price),
    cost: p.cost ? parseFloat(p.cost) : null,
    stock: p.stock,
    description: p.description,
    image: p.image,
    images: p.images || null,
    featured: p.featured || false,
    weight: p.weight ? parseFloat(p.weight) : null,
    width: p.width ? parseFloat(p.width) : null,
    height: p.height ? parseFloat(p.height) : null,
    depth: p.depth ? parseFloat(p.depth) : null,
  }));

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      brand: "",
      price: 0,
      cost: "",
      stock: 0,
      description: "",
      featured: false,
      weight: "",
      width: "",
      height: "",
      depth: "",
    },
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageUpload = async (file: File) => {
    if (imageUrls.length >= MAX_IMAGES) {
      toast({ 
        title: "Limite atingido", 
        description: `Maximo de ${MAX_IMAGES} imagens por produto.`, 
        variant: "destructive" 
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no upload');
      }
      
      const data = await response.json();
      setImageUrls(prev => [...prev, data.url]);
      toast({ title: "Imagem enviada" });
    } catch (error: any) {
      toast({ 
        title: "Erro no upload", 
        description: error.message || "Falha ao enviar imagem", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        brand: data.brand || null,
        price: data.price.toFixed(2),
        cost: data.cost && typeof data.cost === 'number' ? data.cost.toFixed(2) : null,
        stock: data.stock,
        description: data.description || null,
        image: imageUrls[0] || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        featured: data.featured,
      };
      await apiRequest("POST", "/api/products", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormValues }) => {
      const payload = {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        brand: data.brand || null,
        price: data.price.toFixed(2),
        cost: data.cost && typeof data.cost === 'number' ? data.cost.toFixed(2) : null,
        stock: data.stock,
        description: data.description || null,
        image: imageUrls[0] || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        featured: data.featured,
      };
      await apiRequest("PATCH", `/api/products/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/products/${id}/toggle-featured`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const handleToggleFeatured = (product: ProductData) => {
    toggleFeaturedMutation.mutate(product.id, {
      onSuccess: () => {
        toast({ 
          title: product.featured ? "Removido dos destaques" : "Adicionado aos destaques",
          description: product.name,
        });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao alterar destaque", variant: "destructive" });
      },
    });
  };

  const openAddForm = () => {
    form.reset({ name: "", sku: "", categoryId: "", brand: "", price: 0, cost: "", stock: 0, description: "", featured: false, weight: "", width: "", height: "", depth: "" });
    setEditingProduct(null);
    setImageUrls([]);
    setActiveFormTab("dados");
    setViewMode("form");
  };

  const openEditForm = (product: ProductData) => {
    form.reset({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId ? String(product.categoryId) : "",
      brand: product.brand,
      price: product.price,
      cost: product.cost ?? "",
      stock: product.stock,
      description: product.description || "",
      featured: product.featured,
      weight: product.weight ?? "",
      width: product.width ?? "",
      height: product.height ?? "",
      depth: product.depth ?? "",
    });
    setEditingProduct(product);
    const existingImages = product.images || (product.image ? [product.image] : []);
    setImageUrls(existingImages);
    setActiveFormTab("dados");
    setViewMode("form");
  };

  const openCloneForm = (product: ProductData) => {
    const baseSku = product.sku.replace(/-\d+$/, '');
    const existingSkus = products.map(p => p.sku);
    let counter = 1;
    let newSku = `${baseSku}-${counter}`;
    while (existingSkus.includes(newSku)) {
      counter++;
      newSku = `${baseSku}-${counter}`;
    }
    form.reset({
      name: product.name + " (Copia)",
      sku: newSku,
      categoryId: product.categoryId ? String(product.categoryId) : "",
      brand: product.brand,
      price: product.price,
      cost: product.cost ?? "",
      stock: product.stock,
      description: product.description || "",
      featured: false,
      weight: product.weight ?? "",
      width: product.width ?? "",
      height: product.height ?? "",
      depth: product.depth ?? "",
    });
    setEditingProduct(null);
    const existingImages = product.images || (product.image ? [product.image] : []);
    setImageUrls(existingImages);
    setActiveFormTab("dados");
    setViewMode("form");
  };

  const handleSubmit = (values: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate(
        { id: editingProduct.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "Produto atualizado", description: values.name });
            setViewMode("list");
          },
          onError: () => {
            toast({ title: "Erro", description: "Falha ao atualizar produto", variant: "destructive" });
          },
        }
      );
    } else {
      createProductMutation.mutate(values, {
        onSuccess: () => {
          toast({ title: "Produto criado", description: values.name });
          setViewMode("list");
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao criar produto", variant: "destructive" });
        },
      });
    }
  };

  const handleDelete = (product: ProductData) => {
    if (!window.confirm(`Excluir "${product.name}"?`)) return;
    deleteProductMutation.mutate(product.id, {
      onSuccess: () => {
        toast({ title: "Produto excluido", description: product.name });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao excluir produto", variant: "destructive" });
      },
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  if (viewMode === "form") {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewMode("list")}
              data-testid="button-back-products"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {editingProduct ? `Editando: ${editingProduct.name}` : "Preencha os dados do produto"}
              </p>
            </div>
            <Button 
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-save-product"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <Form {...form}>
              <form className="space-y-6 max-w-4xl">
                <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="dados" className="gap-2">
                      <Package className="h-4 w-4" />
                      Dados
                    </TabsTrigger>
                    <TabsTrigger value="precos" className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precos
                    </TabsTrigger>
                    <TabsTrigger value="estoque" className="gap-2">
                      <Boxes className="h-4 w-4" />
                      Estoque
                    </TabsTrigger>
                    <TabsTrigger value="imagens" className="gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Imagens
                    </TabsTrigger>
                    <TabsTrigger value="dimensoes" className="gap-2">
                      <Ruler className="h-4 w-4" />
                      Dimensoes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dados" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">Informacoes Basicas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Produto *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Ex: Camiseta Polo Masculina"
                                  data-testid="input-product-name" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Codigo (SKU) *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Ex: CAM-001"
                                    data-testid="input-product-sku" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Marca</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Ex: Nike"
                                    data-testid="input-product-brand" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-product-category">
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categoriesData.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descricao</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Descreva as caracteristicas do produto..."
                                  className="min-h-[120px]"
                                  data-testid="input-product-description" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Produto em Destaque</FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  Exibir na secao de destaques do catalogo
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-product-featured"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="precos" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">Valores</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preco de Venda *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                    <Input 
                                      {...field} 
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="pl-10"
                                      data-testid="input-product-price" 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custo</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                    <Input 
                                      {...field} 
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="pl-10"
                                      placeholder="0.00"
                                      data-testid="input-product-cost" 
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("price") > 0 && form.watch("cost") && typeof form.watch("cost") === 'number' && (form.watch("cost") as number) > 0 && (
                          <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                            <p className="text-2xl font-bold text-green-600">
                              {(((form.watch("price") - (form.watch("cost") as number)) / form.watch("price")) * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lucro: {formatPrice(form.watch("price") - (form.watch("cost") as number))}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="estoque" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">Controle de Estoque</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantidade em Estoque</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  min="0"
                                  className="max-w-[200px]"
                                  data-testid="input-product-stock" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="imagens" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">Imagens do Produto</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-5 gap-4">
                          {imageUrls.map((url, index) => (
                            <div 
                              key={index} 
                              className="relative aspect-square rounded-lg border-2 overflow-hidden bg-muted group"
                            >
                              <img 
                                src={url} 
                                alt={`Imagem ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                                data-testid={`button-remove-image-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {index === 0 && (
                                <Badge className="absolute bottom-2 left-2 text-xs bg-orange-500">
                                  Principal
                                </Badge>
                              )}
                            </div>
                          ))}
                          
                          {imageUrls.length < MAX_IMAGES && (
                            <label className="cursor-pointer aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-orange-500 hover:text-orange-500 transition-colors">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file);
                                  e.target.value = '';
                                }}
                                data-testid="input-product-image"
                              />
                              {isUploading ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-8 w-8" />
                                  <span className="text-xs text-center">Adicionar<br/>imagem</span>
                                </>
                              )}
                            </label>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Formatos: JPG, PNG, WebP, GIF. Maximo 5 imagens. A primeira sera a imagem principal.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="dimensoes" className="space-y-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-base">Medidas e Peso</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Informacoes para calculo de frete e logistica
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peso (kg)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="Ex: 0.500"
                                  className="max-w-[200px]"
                                  data-testid="input-product-weight" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Separator />

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="width"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Largura (cm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Ex: 20"
                                    data-testid="input-product-width" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="height"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Altura (cm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Ex: 15"
                                    data-testid="input-product-height" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="depth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Profundidade (cm)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Ex: 10"
                                    data-testid="input-product-depth" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </div>

          <div className="w-80 border-l bg-muted/30 p-4 hidden lg:block">
            <h3 className="font-semibold mb-4">Preview</h3>
            <Card>
              <CardContent className="p-3">
                <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center overflow-hidden">
                  {imageUrls[0] ? (
                    <img src={imageUrls[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <h4 className="font-medium text-sm truncate">
                  {form.watch("name") || "Nome do produto"}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {form.watch("sku") || "SKU"}
                </p>
                <p className="font-bold text-orange-500 mt-2">
                  {formatPrice(form.watch("price") || 0)}
                </p>
                {form.watch("featured") && (
                  <Badge className="mt-2 bg-yellow-500/20 text-yellow-600">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Destaque
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catalogo de produtos</p>
        </div>
        <Button 
          onClick={openAddForm} 
          className="bg-orange-500 hover:bg-orange-600"
          data-testid="button-add-product"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou codigo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-products"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} produto(s)
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery ? "Tente buscar por outro termo" : "Adicione seu primeiro produto"}
            </p>
            {!searchQuery && (
              <Button onClick={openAddForm} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16"></TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preco</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className="hover-elevate cursor-pointer"
                  onClick={() => openEditForm(product)}
                  data-testid={`row-product-${product.id}`}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.sku}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      {product.featured && (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.category}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-right">
                    <span className={product.stock === 0 ? "text-destructive font-medium" : ""}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(product)}
                        title={product.featured ? "Remover destaque" : "Adicionar destaque"}
                        data-testid={`button-featured-${product.id}`}
                      >
                        <Star className={`h-4 w-4 ${product.featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCloneForm(product)}
                        title="Duplicar"
                        data-testid={`button-clone-${product.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(product)}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product)}
                        className="text-destructive"
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
