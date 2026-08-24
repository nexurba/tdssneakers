import "server-only";
import { eq, desc } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { orders, orderItems, customers } from "@/db/schema";
import { orders as staticOrders } from "@/data/orders";
import { OrderData, OrderItemData } from "./types";

function staticToOrderData(): OrderData[] {
  return staticOrders.map((o, i) => ({
    id: i + 1,
    reference: o.id,
    email: o.email,
    customerName: o.customer,
    address: o.address,
    status: o.status,
    subtotal: o.total,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: o.total,
    paid: o.status !== "cancelled" && o.status !== "pending",
    createdAt: o.date,
    items: o.items.map((it) => ({
      name: it.name,
      size: it.size,
      quantity: it.quantity,
      unitPrice: it.price,
    })),
  }));
}

export async function getOrders(): Promise<OrderData[]> {
  if (!isDbConfigured) return staticToOrderData();

  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  if (rows.length === 0) return [];

  const allItems = await db.select().from(orderItems);
  const itemsByOrder = new Map<number, OrderItemData[]>();
  for (const it of allItems) {
    const list = itemsByOrder.get(it.orderId) ?? [];
    list.push({
      productId: it.productId,
      name: it.name,
      variant: it.variant,
      size: it.size,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
    });
    itemsByOrder.set(it.orderId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    customerId: r.customerId,
    email: r.email,
    customerName: r.customerName,
    phone: r.phone,
    address: r.address,
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    city: r.city,
    province: r.province,
    postalCode: r.postalCode,
    country: r.country,
    addressValidated: r.addressValidated,
    addressSource: r.addressSource,
    status: r.status,
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    tax: Number(r.tax),
    discount: Number(r.discount),
    total: Number(r.total),
    paid: r.paid,
    createdAt: r.createdAt.toISOString().slice(0, 10),
    items: itemsByOrder.get(r.id) ?? [],
  }));
}

export async function updateOrderStatus(
  id: number,
  status: OrderData["status"]
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, id));
}

// ---- Order creation (called after successful payment) ------------------------

/** Structured delivery address captured at checkout. */
export interface OrderAddressInput {
  line1: string;
  line2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  validated?: boolean;
  /** Which service confirmed it, e.g. "geo.ca". */
  source?: string | null;
}

export interface CreateOrderInput {
  reference: string;
  email: string;
  customerName: string;
  phone?: string | null;
  /** Single-line rendering, kept for emails and admin display. */
  address?: string;
  /** Present for orders placed after structured capture was introduced. */
  structuredAddress?: OrderAddressInput;
  items: OrderItemData[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  squarePaymentId?: string;
  squareOrderId?: string;
  paid: boolean;
}

export async function createOrder(input: CreateOrderInput): Promise<number> {
  if (!isDbConfigured) {
    throw new Error("Base de données non configurée.");
  }

  // Upsert customer (CRM) by email.
  const existing = await db
    .select()
    .from(customers)
    .where(eq(customers.email, input.email))
    .limit(1);

  // The city now comes from a real field. Previously it was guessed by
  // splitting the free-text address on commas and taking the second-to-last
  // fragment, which produced garbage for most address shapes.
  const city = input.structuredAddress?.city?.trim() || undefined;

  let customerId: number;
  if (existing.length > 0) {
    const c = existing[0];
    const newTotalOrders = c.totalOrders + 1;
    const newTotalSpent = Number(c.totalSpent) + input.total;
    customerId = c.id;
    await db
      .update(customers)
      .set({
        totalOrders: newTotalOrders,
        totalSpent: String(newTotalSpent),
        segment:
          newTotalSpent >= 500 ? "vip" : newTotalOrders > 1 ? "recurrent" : "nouveau",
        city: city ?? c.city,
        // Keep the most recent number we were given.
        phone: input.phone ?? c.phone,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, c.id));
  } else {
    const [c] = await db
      .insert(customers)
      .values({
        email: input.email,
        name: input.customerName,
        phone: input.phone ?? null,
        city,
        segment: "nouveau",
        totalOrders: 1,
        totalSpent: String(input.total),
      })
      .returning();
    customerId = c.id;
  }

  const [order] = await db
    .insert(orders)
    .values({
      reference: input.reference,
      customerId,
      email: input.email,
      customerName: input.customerName,
      phone: input.phone ?? null,
      address: input.address,
      addressLine1: input.structuredAddress?.line1 ?? null,
      addressLine2: input.structuredAddress?.line2 ?? null,
      city: input.structuredAddress?.city ?? null,
      province: input.structuredAddress?.province ?? null,
      postalCode: input.structuredAddress?.postalCode ?? null,
      country: input.structuredAddress?.country ?? "CA",
      latitude:
        input.structuredAddress?.latitude != null
          ? String(input.structuredAddress.latitude)
          : null,
      longitude:
        input.structuredAddress?.longitude != null
          ? String(input.structuredAddress.longitude)
          : null,
      addressValidated: input.structuredAddress?.validated ?? false,
      addressSource: input.structuredAddress?.source ?? null,
      status: "processing",
      subtotal: String(input.subtotal),
      shipping: String(input.shipping),
      tax: String(input.tax),
      discount: String(input.discount),
      total: String(input.total),
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntent: input.stripePaymentIntent,
      squarePaymentId: input.squarePaymentId,
      squareOrderId: input.squareOrderId,
      paid: input.paid,
    })
    .returning();

  if (input.items.length > 0) {
    await db.insert(orderItems).values(
      input.items.map((it) => ({
        orderId: order.id,
        productId: it.productId ?? null,
        name: it.name,
        variant: it.variant,
        size: it.size,
        quantity: it.quantity,
        unitPrice: String(it.unitPrice),
      }))
    );
  }

  return order.id;
}
