"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrderData } from "@/lib/data/types";
import { updateOrderStatusAction } from "./actions";

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

type Status = OrderData["status"];

export default function OrdersManager({ initialOrders }: { initialOrders: OrderData[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<OrderData | null>(null);

  const orders = initialOrders;
  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  function changeStatus(id: number, status: Status) {
    startTransition(async () => {
      await updateOrderStatusAction(id, status);
      setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {orders.length} commande{orders.length !== 1 ? "s" : ""} · Revenu: {revenue.toLocaleString("fr-CA")} $ CAD
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Toutes" },
          { key: "pending", label: "En attente" },
          { key: "processing", label: "En cours" },
          { key: "shipped", label: "Expédiées" },
          { key: "delivered", label: "Livrées" },
          { key: "cancelled", label: "Annulées" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === tab.key ? "bg-gray-900 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">({orders.filter((o) => o.status === tab.key).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b">
                <th className="px-6 py-3">Commande</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Articles</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.reference}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.items.length} article{order.items.length !== 1 ? "s" : ""}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{order.total} $</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.createdAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelected(order)} className="text-sm text-primary hover:text-primary-dark font-medium">
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-12"><p className="text-gray-500 text-sm">Aucune commande.</p></div>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold">Commande {selected.reference}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Client</h3>
                <p className="text-sm font-medium">{selected.customerName}</p>
                <p className="text-sm text-gray-500">
                  <a href={`mailto:${selected.email}`} className="hover:underline">
                    {selected.email}
                  </a>
                </p>
                {selected.phone && (
                  <p className="text-sm text-gray-500">
                    <a href={`tel:${selected.phone.replace(/\D/g, "")}`} className="hover:underline">
                      {selected.phone}
                    </a>
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Livraison
                </h3>
                {selected.addressLine1 ? (
                  <address className="text-sm text-gray-700 not-italic leading-relaxed">
                    {selected.addressLine1}
                    {selected.addressLine2 && (
                      <>
                        <br />
                        {selected.addressLine2}
                      </>
                    )}
                    <br />
                    {[selected.city, selected.province, selected.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                    {selected.country && selected.country !== "CA" && (
                      <>
                        <br />
                        {selected.country}
                      </>
                    )}
                  </address>
                ) : selected.address ? (
                  // Orders placed before the address was captured field by field.
                  <p className="text-sm text-gray-700">{selected.address}</p>
                ) : (
                  <p className="text-sm text-gray-400">Aucune adresse enregistrée</p>
                )}

                {/* Whether a lookup service confirmed the address, so support
                    knows when to call before shipping. */}
                {selected.addressLine1 && (
                  <p className="mt-2">
                    {selected.addressValidated ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Adresse vérifiée
                        {selected.addressSource ? ` (${selected.addressSource})` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        Adresse non vérifiée — à confirmer avant expédition
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Articles</h3>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Taille: {item.size} · Qté: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">{item.unitPrice * item.quantity} $</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{selected.total} $ CAD</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Statut</h3>
                <div className="flex flex-wrap gap-2">
                  {(["pending", "processing", "shipped", "delivered", "cancelled"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => changeStatus(selected.id, status)}
                      disabled={isPending}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        selected.status === status ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
