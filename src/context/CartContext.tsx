"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { StoreProduct } from "@/lib/data/types";

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  variant: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: StoreProduct, size: string) => void;
  removeFromCart: (productId: number, size: string) => void;
  updateQuantity: (productId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "tdssneakers_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  // Persist cart on change.
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product: StoreProduct, size: string) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.id && item.size === size
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          variant: product.variant,
          image: product.image,
          price: product.price,
          size,
          quantity: 1,
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: number, size: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.size === size)
      )
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: number, size: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter((item) => !(item.productId === productId && item.size === size))
        );
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
