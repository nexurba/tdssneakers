import { Product } from "@/data/products";

/**
 * Storefront-facing product model. Extends the base Product with fields
 * that come from the database (slug, description, gallery, per-size stock).
 */
export interface StoreProduct extends Product {
  slug: string;
  description?: string | null;
  images?: string[];
  stockBySize?: Record<string, number>;
  isActive?: boolean;
  gender?: "homme" | "femme" | "enfant" | "unisex" | null;
  /** Scale the sizes were entered in (unisex products only). */
  sizeScale?: "men" | "women" | null;
  brand?: string | null;
  productCode?: string | null;
  colorHex?: string | null;
}

export interface OrderItemData {
  productId?: number | null;
  name: string;
  variant?: string | null;
  size: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderData {
  id: number;
  reference: string;
  customerId?: number | null;
  email: string;
  customerName: string;
  phone?: string | null;
  /** Single-line rendering of the delivery address. */
  address?: string | null;
  /** Structured fields, absent on orders placed before they were captured. */
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  /** True when an address lookup service confirmed the address. */
  addressValidated?: boolean;
  addressSource?: string | null;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paid: boolean;
  createdAt: string;
  items: OrderItemData[];
}

export interface CustomerData {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  segment: "nouveau" | "recurrent" | "vip";
  totalOrders: number;
  totalSpent: number;
  notes?: string | null;
  lastOrder?: string | null;
}
