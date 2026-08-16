"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product, products as defaultProducts } from "@/data/products";
import { isSaleorEnabled } from "@/lib/saleor/config";
import { fetchSaleorProducts } from "@/lib/saleor/products";

export type ProductSource = "static" | "saleor";

interface ProductContextType {
  products: Product[];
  source: ProductSource;
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: number, updates: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  getProduct: (id: number) => Product | undefined;
  refresh: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const STORAGE_KEY = "tdssneakers_products";

function loadLocalProducts(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveLocalProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {}
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [source, setSource] = useState<ProductSource>("static");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const loadProducts = useCallback(async () => {
    // 1. Try Saleor if enabled.
    if (isSaleorEnabled()) {
      setLoading(true);
      setError(null);
      try {
        const saleorProducts = await fetchSaleorProducts(24);
        if (saleorProducts.length > 0) {
          setProducts(saleorProducts);
          setSource("saleor");
          setLoading(false);
          setHydrated(true);
          return;
        }
        setError("Aucun produit retourné par Saleor. Utilisation du catalogue local.");
      } catch (err) {
        setError(
          `Connexion Saleor échouée: ${(err as Error).message}. Utilisation du catalogue local.`
        );
      }
      setLoading(false);
    }

    // 2. Fall back to locally persisted products, then static defaults.
    const local = loadLocalProducts();
    setProducts(local ?? defaultProducts);
    setSource("static");
    setHydrated(true);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Persist admin edits only when using the local/static source.
  useEffect(() => {
    if (hydrated && source === "static") {
      saveLocalProducts(products);
    }
  }, [products, hydrated, source]);

  const addProduct = useCallback((productData: Omit<Product, "id">) => {
    const newProduct: Product = { ...productData, id: Date.now() };
    setProducts((prev) => [newProduct, ...prev]);
  }, []);

  const updateProduct = useCallback((id: number, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProduct = useCallback(
    (id: number) => products.find((p) => p.id === id),
    [products]
  );

  return (
    <ProductContext.Provider
      value={{
        products,
        source,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        refresh: loadProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
