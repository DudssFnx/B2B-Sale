import { CatalogFilters } from "../CatalogFilters";
import { useState } from "react";

// todo: remove mock functionality
const categories = ["Machinery", "Hydraulics", "Materials", "Safety"];
const brands = ["TechParts", "FlowMax", "SteelCo", "SafeFlow"];

export default function CatalogFiltersExample() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");

  return (
    <CatalogFilters
      searchQuery={search}
      onSearchChange={setSearch}
      category={category}
      onCategoryChange={setCategory}
      brand={brand}
      onBrandChange={setBrand}
      categories={categories}
      brands={brands}
      onClearFilters={() => {
        setSearch("");
        setCategory("all");
        setBrand("all");
      }}
    />
  );
}
