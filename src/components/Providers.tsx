"use client";

import { ProductProvider } from "@/context/ProductContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ProductProvider>{children}</ProductProvider>;
}
