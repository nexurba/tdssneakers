"use client";

import { useState, useEffect, useCallback } from "react";
import { StoreProduct } from "@/lib/data/types";
import { toSizePair } from "@/lib/catalog/size-conversion";
import { useCart } from "@/context/CartContext";

export default function ProductDetailClient({ product }: { product: StoreProduct }) {
  const { addToCart, openCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes[0] ?? null
  );
  const images =
    product.images && product.images.length > 0 ? product.images : [product.image];
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const goNext = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length]
  );

  // Keyboard navigation for the gallery.
  useEffect(() => {
    if (images.length <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, images.length]);

  const isUnisex = product.gender === "unisex";
  // Shoppers can flip a unisex product between the men's and women's scale.
  const [scale, setScale] = useState<"men" | "women">(
    product.sizeScale === "women" ? "women" : "men"
  );

  const stockForSize = selectedSize ? product.stockBySize?.[selectedSize] ?? 0 : 0;
  const outOfStock = selectedSize !== null && stockForSize <= 0;

  function handleAdd() {
    if (!selectedSize) return;
    addToCart(product, selectedSize);
    openCart();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group">
          <img
            src={images[index]}
            alt={`${product.name} — image ${index + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {images.length > 1 && (
            <>
              {/* Prev / Next arrows */}
              <button
                onClick={goPrev}
                aria-label="Image précédente"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                aria-label="Image suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition-colors md:opacity-0 md:group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Counter */}
              <span className="absolute bottom-3 right-3 text-xs font-medium bg-black/60 text-white px-2 py-1 rounded-full">
                {index + 1} / {images.length}
              </span>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Aller à l'image ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 mt-3">
            {images.map((image, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === index ? "border-primary" : "border-transparent hover:border-gray-300"
                }`}
              >
                <img src={image} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {product.isNew && (
          <span className="inline-block bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded mb-3">
            NOUVEAU
          </span>
        )}
        <h1 className="text-3xl font-black text-gray-900">{product.name}</h1>
        <p className="text-gray-500 mt-1">{product.variant} · {product.color}</p>
        <p className="text-2xl font-bold mt-4">{product.price},00 $ CAD</p>

        {product.description && (
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">{product.description}</p>
        )}

        {/* Size selector */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Taille</p>
            {isUnisex && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500 mr-1">Échelle :</span>
                {(["men", "women"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`px-2 py-1 rounded-md border font-medium transition-colors ${
                      scale === s
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-300 hover:border-black"
                    }`}
                  >
                    {s === "men" ? "Homme" : "Femme"}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isUnisex && (
            <p className="text-xs text-gray-500 mb-2">
              Modèle unisexe — tailles affichées en échelle {scale === "men" ? "Homme" : "Femme"}.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => {
              const stock = product.stockBySize?.[size] ?? 0;
              const disabled = stock <= 0;
              // For unisex, `size` is the canonical men's value; show the
              // equivalent on the scale the shopper selected.
              const pair = isUnisex ? toSizePair(product.category, "men", size) : null;
              const label = pair ? (scale === "women" ? pair.women : pair.men) : size;
              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={disabled}
                  className={`min-w-[3rem] px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? "bg-black text-white border-black"
                      : disabled
                      ? "bg-gray-50 text-gray-300 border-gray-200 line-through cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:border-black"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {selectedSize && (
            <p className="text-xs text-gray-500 mt-2">
              {outOfStock ? "Rupture de stock" : `${stockForSize} en stock`}
            </p>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAdd}
          disabled={!selectedSize || outOfStock}
          className="mt-6 w-full bg-black text-white py-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock ? "RUPTURE DE STOCK" : "AJOUTER AU PANIER"}
        </button>

        <div className="mt-6 space-y-2 text-sm text-gray-500">
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
            Livraison rapide au Canada
          </p>
          <p className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Retours faciles sous 14 jours
          </p>
        </div>
      </div>
    </div>
  );
}
