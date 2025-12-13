import { ProductCard } from "../ProductCard";

// todo: remove mock functionality
const mockProduct = {
  id: "1",
  name: "Industrial Bearing Set - Heavy Duty",
  sku: "BRG-001",
  category: "Machinery Parts",
  brand: "TechParts",
  price: 149.99,
  stock: 25,
};

export default function ProductCardExample() {
  return (
    <div className="max-w-[280px]">
      <ProductCard
        product={mockProduct}
        onAddToCart={(p) => console.log("Added to cart:", p.name)}
      />
    </div>
  );
}
