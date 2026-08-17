import { getOrders } from "@/lib/data/orders";
import OrdersManager from "./OrdersManager";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  return <OrdersManager initialOrders={orders} />;
}
