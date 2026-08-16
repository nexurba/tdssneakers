"use client";

import Link from "next/link";
import { useProducts } from "@/context/ProductContext";
import ProductCard from "./ProductCard";

export default function BestSellers() {
  const { products } = useProducts();
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 border-b-4 border-primary pb-2">
            BEST SELLERS
          </h2>
          <Link
            href="/boutique"
            className="text-sm font-semibold text-gray-700 hover:text-primary flex items-center gap-1 transition-colors"
          >
            VOIR TOUT
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
