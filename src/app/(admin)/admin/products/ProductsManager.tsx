"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StoreProduct } from "@/lib/data/types";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "./actions";

interface FormState {
  name: string;
  variant: string;
  price: string;
  category: "sneakers" | "vetements";
  sizes: string;
  color: string;
  images: string;
  description: string;
  isNew: boolean;
  isBestSeller: boolean;
  stockBySize: Record<string, string>;
}

const emptyForm: FormState = {
  name: "",
  variant: "",
  price: "",
  category: "sneakers",
  sizes: "",
  color: "",
  images: "",
  description: "",
  isNew: false,
  isBestSeller: false,
  stockBySize: {},
};

function parseSizes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ProductsManager({
  initialProducts,
  dbConfigured,
}: {
  initialProducts: StoreProduct[];
  dbConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const products = initialProducts;
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.variant.toLowerCase().includes(search.toLowerCase()) ||
      p.color.toLowerCase().includes(search.toLowerCase())
  );

  function notify(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setModalMode("add");
  }

  function openEdit(p: StoreProduct) {
    setForm({
      name: p.name,
      variant: p.variant,
      price: String(p.price),
      category: p.category,
      sizes: p.sizes.join(", "),
      color: p.color,
      images: (p.images && p.images.length > 0 ? p.images : [p.image]).join("\n"),
      description: p.description ?? "",
      isNew: p.isNew ?? false,
      isBestSeller: p.isBestSeller ?? false,
      stockBySize: Object.fromEntries(
        Object.entries(p.stockBySize ?? {}).map(([s, n]) => [s, String(n)])
      ),
    });
    setEditingId(p.id);
    setModalMode("edit");
  }

  function close() {
    setModalMode(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("variant", form.variant);
    fd.set("price", form.price);
    fd.set("category", form.category);
    fd.set("color", form.color);
    fd.set("images", form.images);
    fd.set("description", form.description);
    fd.set("sizes", form.sizes);
    fd.set("isNew", form.isNew ? "true" : "false");
    fd.set("isBestSeller", form.isBestSeller ? "true" : "false");
    // Only include stock for sizes currently listed.
    const stock: Record<string, number> = {};
    for (const size of parseSizes(form.sizes)) {
      const raw = form.stockBySize[size];
      if (raw !== undefined && raw !== "") stock[size] = Math.max(0, Number(raw) || 0);
    }
    fd.set("stockBySize", JSON.stringify(stock));
    return fd;
  }

  function submit() {
    const fd = buildFormData();
    startTransition(async () => {
      const result =
        modalMode === "add"
          ? await createProductAction(fd)
          : await updateProductAction(editingId!, fd);
      if (result.ok) {
        notify("success", modalMode === "add" ? "Produit ajouté" : "Produit modifié");
        close();
        router.refresh();
      } else {
        notify("error", result.error ?? "Erreur");
      }
    });
  }

  function remove(id: number) {
    if (!confirm("Supprimer ce produit ? Action irréversible.")) return;
    startTransition(async () => {
      const result = await deleteProductAction(id);
      if (result.ok) {
        notify("success", "Produit supprimé");
        router.refresh();
      } else {
        notify("error", result.error ?? "Erreur");
      }
    });
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }



  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {!dbConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Base de données non configurée. Renseignez <code className="font-mono">DATABASE_URL</code> dans
          <code className="font-mono"> .env.local</code> pour activer l&apos;ajout/modification. Les produits affichés proviennent du catalogue statique.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} produit{products.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={!dbConfigured}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un produit
        </button>
      </div>

      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b">
                <th className="px-6 py-3">Produit</th>
                <th className="px-6 py-3">Catégorie</th>
                <th className="px-6 py-3">Prix</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Tags</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => {
                const totalStock = Object.values(p.stockBySize ?? {}).reduce((a, b) => a + b, 0);
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.variant} · {p.color}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {p.category === "vetements" ? "Vêtements" : "Sneakers"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{p.price},00 $</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={totalStock === 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                        {totalStock} u.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.isNew && <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Nouveau</span>}
                        {p.isBestSeller && <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Best seller</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          disabled={!dbConfigured}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                          aria-label="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          disabled={!dbConfigured}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                          aria-label="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Aucun produit trouvé.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{modalMode === "add" ? "Nouveau produit" : "Modifier le produit"}</h2>
              <button type="button" onClick={close} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nom" required>
                  <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder="Air Jordan 1" />
                </Field>
                <Field label="Variante" required>
                  <input value={form.variant} onChange={(e) => setField("variant", e.target.value)} className={inputCls} placeholder="Black Toe" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix (CAD)" required>
                  <input type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} className={inputCls} placeholder="220" min="0" />
                </Field>
                <Field label="Catégorie" required>
                  <select value={form.category} onChange={(e) => setField("category", e.target.value as FormState["category"])} className={inputCls}>
                    <option value="sneakers">Sneakers</option>
                    <option value="vetements">Vêtements</option>
                  </select>
                </Field>
              </div>
              <Field label="Tailles (séparées par des virgules)" required>
                <input value={form.sizes} onChange={(e) => setField("sizes", e.target.value)} className={inputCls} placeholder="7, 8, 9, 10, 11" />
              </Field>

              {parseSizes(form.sizes).length > 0 && (
                <Field label="Stock par taille">
                  <div className="flex flex-wrap gap-2">
                    {parseSizes(form.sizes).map((size) => (
                      <div key={size} className="flex items-center gap-1.5 border rounded-lg px-2 py-1">
                        <span className="text-xs font-medium text-gray-600 min-w-[1.5rem]">{size}</span>
                        <input
                          type="number"
                          min="0"
                          value={form.stockBySize[size] ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              stockBySize: { ...prev.stockBySize, [size]: e.target.value },
                            }))
                          }
                          placeholder="25"
                          className="w-16 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Laissez vide pour conserver le stock actuel (ou 25 par défaut à la création).</p>
                </Field>
              )}
              <Field label="Couleur" required>
                <input value={form.color} onChange={(e) => setField("color", e.target.value)} className={inputCls} placeholder="Noir" />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} className={inputCls} rows={2} placeholder="Description du produit..." />
              </Field>
              <Field label="Images (une URL par ligne)">
                <textarea
                  value={form.images}
                  onChange={(e) => setField("images", e.target.value)}
                  className={inputCls}
                  rows={3}
                  placeholder={"https://images.unsplash.com/photo-1\nhttps://images.unsplash.com/photo-2"}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  La 1re image est la principale. Les suivantes sont défilables sur la fiche produit.
                </p>
                {form.images.trim() && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.images
                      .split(/[\n,]+/)
                      .map((u) => u.trim())
                      .filter(Boolean)
                      .map((u, i) => (
                        <img
                          key={i}
                          src={u}
                          alt={`Aperçu ${i + 1}`}
                          className="w-14 h-14 object-cover rounded-lg bg-gray-100 border"
                          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                        />
                      ))}
                  </div>
                )}
              </Field>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isNew} onChange={(e) => setField("isNew", e.target.checked)} className="w-4 h-4 accent-red-500 rounded" />
                  <span className="text-sm">Nouveau</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isBestSeller} onChange={(e) => setField("isBestSeller", e.target.checked)} className="w-4 h-4 accent-red-500 rounded" />
                  <span className="text-sm">Best seller</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={close} className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer">
                  Annuler
                </button>
                <button type="button" onClick={submit} disabled={isPending} className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer">
                  {isPending ? "..." : modalMode === "add" ? "Ajouter" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
