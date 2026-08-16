"use client";

import { orders } from "@/data/orders";

// Derive customers from orders
const customers = Array.from(
  new Map(
    orders.map((o) => [
      o.email,
      {
        name: o.customer,
        email: o.email,
        totalOrders: orders.filter((x) => x.email === o.email).length,
        totalSpent: orders
          .filter((x) => x.email === o.email && x.status !== "cancelled")
          .reduce((sum, x) => sum + x.total, 0),
        lastOrder: orders
          .filter((x) => x.email === o.email)
          .sort((a, b) => b.date.localeCompare(a.date))[0].date,
        city: o.address.split(",").pop()?.trim() || "",
      },
    ])
  ).values()
);

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="text-sm text-gray-500 mt-1">
          {customers.length} client{customers.length !== 1 ? "s" : ""} enregistrés
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total clients</p>
          <p className="text-2xl font-bold mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Revenu moyen / client</p>
          <p className="text-2xl font-bold mt-1">
            {Math.round(
              customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length
            )}{" "}
            $
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Clients récurrents</p>
          <p className="text-2xl font-bold mt-1">
            {customers.filter((c) => c.totalOrders > 1).length}
          </p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Ville</th>
                <th className="px-6 py-3">Commandes</th>
                <th className="px-6 py-3">Dépenses totales</th>
                <th className="px-6 py-3">Dernière commande</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.city}</td>
                  <td className="px-6 py-4 text-sm font-medium">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{customer.totalSpent} $</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{customer.lastOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
