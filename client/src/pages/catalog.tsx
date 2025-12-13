import { useState, useMemo } from "react";
import { CatalogFilters } from "@/components/CatalogFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/components/ProductCard";

// todo: remove mock functionality
const mockProducts: Product[] = [
  { id: "1", name: "Industrial Bearing Set - Heavy Duty", sku: "BRG-001", category: "Machinery", brand: "TechParts", price: 149.99, stock: 25 },
  { id: "2", name: "Hydraulic Pump Motor 5HP", sku: "HYD-102", category: "Hydraulics", brand: "FlowMax", price: 599.00, stock: 8 },
  { id: "3", name: "Steel Cable 10m - Industrial Grade", sku: "CBL-203", category: "Materials", brand: "SteelCo", price: 45.50, stock: 120 },
  { id: "4", name: "Safety Valve Kit - Universal", sku: "VLV-304", category: "Safety", brand: "SafeFlow", price: 89.99, stock: 0 },
  { id: "5", name: "Precision Gearbox Assembly", sku: "GBX-405", category: "Machinery", brand: "TechParts", price: 324.00, stock: 15 },
  { id: "6", name: "Hydraulic Hose 20m", sku: "HOS-506", category: "Hydraulics", brand: "FlowMax", price: 78.50, stock: 45 },
  { id: "7", name: "Aluminum Sheet 4x8ft", sku: "ALU-607", category: "Materials", brand: "SteelCo", price: 125.00, stock: 30 },
  { id: "8", name: "Emergency Stop Button Kit", sku: "ESB-708", category: "Safety", brand: "SafeFlow", price: 34.99, stock: 200 },
];

const categories = ["Machinery", "Hydraulics", "Materials", "Safety"];
const brands = ["TechParts", "FlowMax", "SteelCo", "SafeFlow"];

export default function CatalogPage() {
  const { addItem, openCart, itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "all" || product.category === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [searchQuery, category, brand]);

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
          <h1 className="text-3xl font-semibold">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Browse our complete product selection
          </p>
        </div>
        <Button onClick={openCart} data-testid="button-view-cart">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart ({itemCount})
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
          Showing {filteredProducts.length} of {mockProducts.length} products
        </p>
      </div>

      <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
    </div>
  );
}
