"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={`${product.name} - ${product.variant}`}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out ${
            isHovered ? "scale-110" : "scale-100"
          }`}
          loading="lazy"
        />

        {/* Quick add button on hover */}
        <div
          className={`absolute bottom-3 right-3 transition-all duration-200 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <button
            onClick={() => addToCart(product, product.sizes[0])}
            className="bg-black text-white p-2.5 rounded-full hover:bg-primary transition-colors shadow-lg"
            aria-label="Ajouter au panier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>

        {/* New badge */}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">
            NEW
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-1">{product.variant}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">{product.price},00 $ CAD</p>
          <button
            onClick={() => addToCart(product, product.sizes[0])}
            className="text-gray-400 hover:text-primary transition-colors"
            aria-label="Ajouter au panier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>
        {/* Sizes */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {product.sizes.map((size) => (
            <span
              key={size}
              className="text-[10px] text-gray-500 border border-gray-200 rounded px-1.5 py-0.5"
            >
              {size}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
