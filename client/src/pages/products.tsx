import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
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
  stock: number;
}

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  categoryId: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  const { data: productsData = [], isLoading } = useQuery<SchemaProduct[]>({
    queryKey: ['/api/products'],
  });

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const categoryMap: Record<number, string> = {};
  categoriesData.forEach(cat => {
    categoryMap[cat.id] = cat.name;
  });

  const products: ProductData[] = productsData.map((p) => ({
    id: String(p.id),
    name: p.name,
    sku: p.sku,
    category: p.categoryId ? categoryMap[p.categoryId] || "Uncategorized" : "Uncategorized",
    categoryId: p.categoryId,
    brand: p.brand || "",
    price: parseFloat(p.price),
    stock: p.stock,
  }));

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      brand: "",
      price: 0,
      stock: 0,
    },
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        brand: data.brand,
        price: data.price.toFixed(2),
        stock: data.stock,
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
        brand: data.brand,
        price: data.price.toFixed(2),
        stock: data.stock,
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

  const openAddDialog = () => {
    form.reset({ name: "", sku: "", categoryId: "", brand: "", price: 0, stock: 0 });
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: ProductData) => {
    form.reset({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId ? String(product.categoryId) : "",
      brand: product.brand,
      price: product.price,
      stock: product.stock,
    });
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate(
        { id: editingProduct.id, data: values },
        {
          onSuccess: () => {
            toast({ title: "Product Updated", description: `${values.name} has been updated.` });
            setIsDialogOpen(false);
          },
          onError: () => {
            toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
          },
        }
      );
    } else {
      createProductMutation.mutate(values, {
        onSuccess: () => {
          toast({ title: "Product Created", description: `${values.name} has been added.` });
          setIsDialogOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
        },
      });
    }
  };

  const handleDelete = (product: ProductData) => {
    deleteProductMutation.mutate(product.id, {
      onSuccess: () => {
        toast({ title: "Product Deleted", description: `${product.name} has been removed.` });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
      },
    });
  };

  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Product Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddDialog} data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-products"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Brand</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold text-right">Stock</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product, idx) => (
                  <TableRow 
                    key={product.id} 
                    className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
                    data-testid={`row-product-${product.id}`}
                  >
                    <TableCell>
                      <Badge variant="outline">{product.sku}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock === 0 ? "text-destructive" : ""}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                          className="text-destructive"
                          disabled={deleteProductMutation.isPending}
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-category">
                            <SelectValue placeholder="Select category" />
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
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-product-brand" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-product-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-product-stock" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-save-product">
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingProduct ? "Save Changes" : "Add Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
