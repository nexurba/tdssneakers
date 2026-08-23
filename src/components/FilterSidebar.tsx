"use client";

import { useState } from "react";

interface FilterSidebarProps {
  onFilterChange: (filters: Filters) => void;
}

export interface Filters {
  sizes: string[];
  colors: string[];
  priceRange: [number, number] | null;
  category: string | null;
}

const availableSizes = ["7", "8", "9", "10", "11", "S", "M", "L", "XL", "XXL"];
const availableColors = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#ffffff" },
  { name: "Gris", hex: "#9ca3af" },
  { name: "Beige", hex: "#d4a574" },
  { name: "Marron", hex: "#8b5e3c" },
];
const priceRanges: { label: string; range: [number, number] }[] = [
  { label: "Moins de 100$", range: [0, 100] },
  { label: "100$ - 150$", range: [100, 150] },
  { label: "150$ - 200$", range: [150, 200] },
  { label: "200$ et plus", range: [200, 9999] },
];

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<[number, number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    size: true,
    color: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSize = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(newSizes);
    onFilterChange({ sizes: newSizes, colors: selectedColors, priceRange: selectedPriceRange, category: selectedCategory });
  };

  const toggleColor = (color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(newColors);
    onFilterChange({ sizes: selectedSizes, colors: newColors, priceRange: selectedPriceRange, category: selectedCategory });
  };

  const selectPriceRange = (range: [number, number] | null) => {
    const newRange = selectedPriceRange?.[0] === range?.[0] && selectedPriceRange?.[1] === range?.[1] ? null : range;
    setSelectedPriceRange(newRange);
    onFilterChange({ sizes: selectedSizes, colors: selectedColors, priceRange: newRange, category: selectedCategory });
  };

  const selectCategory = (cat: string | null) => {
    const newCat = selectedCategory === cat ? null : cat;
    setSelectedCategory(newCat);
    onFilterChange({ sizes: selectedSizes, colors: selectedColors, priceRange: selectedPriceRange, category: newCat });
  };

  const clearAll = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedPriceRange(null);
    setSelectedCategory(null);
    onFilterChange({ sizes: [], colors: [], priceRange: null, category: null });
  };

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedPriceRange || selectedCategory;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">FILTRES</h3>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-primary hover:text-primary-dark transition-colors"
            >
              Effacer tout
            </button>
          )}
        </div>

        {/* Category */}
        <div className="border-t pt-4 mb-4">
          <button
            onClick={() => toggleSection("category")}
            className="flex items-center justify-between w-full text-sm font-semibold mb-3"
          >
            Catégorie
            <svg className={`w-4 h-4 transition-transform ${expandedSections.category ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.category && (
            <div className="space-y-2">
              {["sneakers", "vetements", "accessoires"].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat}
                    onChange={() => selectCategory(cat)}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm">
                    {cat === "vetements"
                      ? "Vêtements"
                      : cat === "accessoires"
                      ? "Accessoires"
                      : "Sneakers"}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Size */}
        <div className="border-t pt-4 mb-4">
          <button
            onClick={() => toggleSection("size")}
            className="flex items-center justify-between w-full text-sm font-semibold mb-3"
          >
            Taille
            <svg className={`w-4 h-4 transition-transform ${expandedSections.size ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.size && (
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                    selectedSizes.includes(size)
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-300 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color */}
        <div className="border-t pt-4 mb-4">
          <button
            onClick={() => toggleSection("color")}
            className="flex items-center justify-between w-full text-sm font-semibold mb-3"
          >
            Couleur
            <svg className={`w-4 h-4 transition-transform ${expandedSections.color ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.color && (
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => toggleColor(color.name)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColors.includes(color.name)
                      ? "border-primary scale-110"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={`Filtre couleur ${color.name}`}
                >
                  {selectedColors.includes(color.name) && (
                    <svg className="w-4 h-4 mx-auto" fill={color.hex === "#000000" ? "white" : "black"} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="border-t pt-4">
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full text-sm font-semibold mb-3"
          >
            Prix
            <svg className={`w-4 h-4 transition-transform ${expandedSections.price ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.price && (
            <div className="space-y-2">
              {priceRanges.map((pr) => (
                <label key={pr.label} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={selectedPriceRange?.[0] === pr.range[0] && selectedPriceRange?.[1] === pr.range[1]}
                    onChange={() => selectPriceRange(pr.range)}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span className="text-sm">{pr.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
