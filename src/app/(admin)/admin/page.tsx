import { getProducts } from "@/lib/data/products";
import { getOrders } from "@/lib/data/orders";
import { getCustomers } from "@/lib/data/customers";
import { isDbConfigured } from "@/db";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default async function AdminDashboard() {
  const [products, orders, customers] = await Promise.all([
    getProducts({ includeInactive: true }),
    getOrders(),
    getCustomers(),
  ]);

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = orders.slice(0, 5);
  const topProducts = products.filter((p) => p.isBestSeller).slice(0, 5);

  const stats = [
    { label: "Revenu total", value: `${revenue.toLocaleString("fr-CA")} $`, change: "+12.5%" },
    { label: "Commandes", value: String(orders.length), change: "+4.3%" },
    { label: "Produits", value: String(products.length), change: "" },
    { label: "Clients", value: String(customers.length), change: "+8.2%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de votre boutique</p>
      </div>

      {/* Data source status */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          isDbConfigured ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        }`}
      >
        <span className={`w-2.5 h-2.5 rounded-full ${isDbConfigured ? "bg-green-500" : "bg-amber-400"}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {isDbConfigured ? "Base de données connectée (Postgres)" : "Mode démo — catalogue statique"}
          </p>
          {!isDbConfigured && (
            <p className="text-xs text-amber-700 mt-0.5">
              Renseignez DATABASE_URL dans .env.local pour activer la persistance, le CRM et les commandes réelles.
            </p>
          )}
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border">
          {isDbConfigured ? "LIVE" : "DÉMO"}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{stat.label}</span>
              {stat.change && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-600">
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Commandes récentes</h2>
            <a href="/admin/orders" className="text-sm text-primary hover:text-primary-dark font-medium">Voir tout</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b">
                  <th className="px-6 py-3">Commande</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Aucune commande</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.reference}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.customerName}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{order.total} $</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="p-6 border-b">
            <h2 className="font-bold text-gray-900">Produits populaires</h2>
          </div>
          <div className="p-4 space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.variant}</p>
                </div>
                <p className="text-sm font-bold">{product.price} $</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
