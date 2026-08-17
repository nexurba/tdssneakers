import { getCustomers } from "@/lib/data/customers";

export const dynamic = "force-dynamic";

const segmentStyles: Record<string, string> = {
  nouveau: "bg-gray-100 text-gray-700",
  recurrent: "bg-blue-50 text-blue-700",
  vip: "bg-amber-50 text-amber-700",
};

const segmentLabels: Record<string, string> = {
  nouveau: "Nouveau",
  recurrent: "Récurrent",
  vip: "VIP",
};

export default async function AdminCustomersPage() {
  const customers = await getCustomers();
  const avgSpend =
    customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length)
      : 0;
  const recurring = customers.filter((c) => c.totalOrders > 1).length;
  const vip = customers.filter((c) => c.segment === "vip").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clients (CRM)</h1>
        <p className="text-sm text-gray-500 mt-1">
          {customers.length} client{customers.length !== 1 ? "s" : ""} enregistré{customers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Total clients</p>
          <p className="text-2xl font-bold mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Panier moyen / client</p>
          <p className="text-2xl font-bold mt-1">{avgSpend} $</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">Récurrents</p>
          <p className="text-2xl font-bold mt-1">{recurring}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm text-gray-500">VIP</p>
          <p className="text-2xl font-bold mt-1">{vip}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b">
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Segment</th>
                <th className="px-6 py-3">Ville</th>
                <th className="px-6 py-3">Commandes</th>
                <th className="px-6 py-3">Dépenses totales</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">Aucun client pour l&apos;instant</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">{c.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${segmentStyles[c.segment]}`}>
                      {segmentLabels[c.segment]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.city || "—"}</td>
                  <td className="px-6 py-4 text-sm font-medium">{c.totalOrders}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{c.totalSpent} $</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
