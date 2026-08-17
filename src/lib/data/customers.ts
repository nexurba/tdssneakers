import "server-only";
import { desc } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { customers } from "@/db/schema";
import { orders as staticOrders } from "@/data/orders";
import { CustomerData } from "./types";

function staticCustomers(): CustomerData[] {
  const byEmail = new Map<string, CustomerData>();
  staticOrders.forEach((o, i) => {
    const existing = byEmail.get(o.email);
    const spent = o.status !== "cancelled" ? o.total : 0;
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += spent;
      if (o.date > (existing.lastOrder ?? "")) existing.lastOrder = o.date;
    } else {
      byEmail.set(o.email, {
        id: i + 1,
        email: o.email,
        name: o.customer,
        city: o.address.split(",").slice(-2, -1)[0]?.trim() ?? "",
        segment: "nouveau",
        totalOrders: 1,
        totalSpent: spent,
        lastOrder: o.date,
      });
    }
  });
  return Array.from(byEmail.values()).map((c) => ({
    ...c,
    segment: c.totalSpent >= 500 ? "vip" : c.totalOrders > 1 ? "recurrent" : "nouveau",
  }));
}

export async function getCustomers(): Promise<CustomerData[]> {
  if (!isDbConfigured) return staticCustomers();

  const rows = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.totalSpent));

  return rows.map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    city: c.city,
    segment: c.segment,
    totalOrders: c.totalOrders,
    totalSpent: Number(c.totalSpent),
    notes: c.notes,
  }));
}
