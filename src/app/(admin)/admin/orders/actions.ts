"use server";

import { revalidatePath } from "next/cache";
import { updateOrderStatus } from "@/lib/data/orders";
import { isDbConfigured } from "@/db";
import { assertAdmin } from "@/lib/auth/admin";

type Status = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export async function updateOrderStatusAction(id: number, status: Status) {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée." };
  }
  try {
    await updateOrderStatus(id, status);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
