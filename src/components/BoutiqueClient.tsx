"use client";

import { useState, useMemo } from "react";
import { StoreProduct } from "@/lib/data/types";
import ProductCard from "@/components/ProductCard";
import FilterSidebar, { Filters } from "@/components/FilterSidebar";

export default function BoutiqueClient({
  products,
  initialCategory,
  heading = "BOUTIQUE",
}: {
  products: StoreProduct[];
  initialCategory?: string | null;
  heading?: string;
}) {
  const [filters, setFilters] = useState<Filters>({
    sizes: [],
    colors: [],
    priceRange: null,
    category:
      initialCategory === "sneakers" ||
      initialCategory === "vetements" ||
      initialCategory === "accessoires"
        ? initialCategory
        : null,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.sizes.length > 0) {
        const hasSize = product.sizes.some((s) => filters.sizes.includes(s));
        if (!hasSize) return false;
      }
      if (filters.colors.length > 0 && !filters.colors.includes(product.color)) {
        return false;
      }
      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        if (product.price < min || product.price > max) return false;
      }
      return true;
    });
  }, [filters, products]);

  return (
    <div className="bg-gray-light min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">{heading}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="lg:hidden flex items-center gap-2 mb-4 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtres
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className={`${mobileFiltersOpen ? "block" : "hidden"} lg:block`}>
            <FilterSidebar onFilterChange={setFilters} />
          </div>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">Aucun produit ne correspond à vos filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
