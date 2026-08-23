"use client";

import { useState } from "react";
import Link from "next/link";
import { StoreProduct } from "@/lib/data/types";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: StoreProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const secondImage =
    product.images && product.images.length > 1 ? product.images[1] : null;

  return (
    <div
      className="group bg-white rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image (flips to 2nd image on hover) */}
      <Link href={`/produit/${product.slug}`} className="block relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={`${product.name} - ${product.variant}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
            isHovered && secondImage ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
        />
        {secondImage && (
          <img
            src={secondImage}
            alt={`${product.name} - autre vue`}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out ${
              isHovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
            }`}
            loading="lazy"
          />
        )}
        {product.isNew && (
          <span className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
            NEW
          </span>
        )}
        {product.images && product.images.length > 1 && (
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full z-10 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {product.images.length}
          </span>
        )}
      </Link>

      {/* Quick add */}
      <div className="relative">
        <div
          className={`absolute -top-14 right-3 transition-all duration-200 ${
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
      </div>

      {/* Info */}
      <div className="p-4">
        <Link href={`/produit/${product.slug}`}>
          <h3 className="text-sm font-bold text-gray-900 truncate hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
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
