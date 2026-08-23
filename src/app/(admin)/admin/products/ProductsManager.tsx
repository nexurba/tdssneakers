"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StoreProduct } from "@/lib/data/types";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "./actions";
import ProductForm, {
  emptyProductForm,
  type ProductFormState,
} from "./ProductForm";
import {
  CATEGORIES,
  GENDERS,
  findColor,
  type ProductCategory,
  type ProductGender,
} from "@/lib/catalog/taxonomy";

function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function genderLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return GENDERS.find((g) => g.value === value)?.label ?? value;
}

function productToForm(p: StoreProduct): ProductFormState {
  return {
    productCode: p.productCode ?? "",
    name: p.name,
    brand: p.brand ?? "",
    variant: p.variant,
    price: String(p.price),
    category: p.category as ProductCategory,
    gender: (p.gender ?? "") as ProductGender | "",
    sizeScale: (p.sizeScale ?? "men") as "men" | "women",
    color: p.color,
    colorHex: p.colorHex ?? findColor(p.color)?.hex ?? "",
    images: p.images && p.images.length > 0 ? p.images : [p.image],
    description: p.description ?? "",
    sizes: p.sizes,
    stockBySize: Object.fromEntries(
      Object.entries(p.stockBySize ?? {}).map(([s, n]) => [s, String(n)])
    ),
    isNew: p.isNew ?? false,
    isBestSeller: p.isBestSeller ?? false,
  };
}

function formToFormData(form: ProductFormState): FormData {
  const fd = new FormData();
  fd.set("name", form.name);
  fd.set("brand", form.brand);
  fd.set("productCode", form.productCode);
  fd.set("variant", form.variant);
  fd.set("price", form.price);
  fd.set("category", form.category);
  fd.set("gender", form.gender);
  fd.set("sizeScale", form.sizeScale);
  fd.set("color", form.color);
  fd.set("colorHex", form.colorHex);
  fd.set("images", form.images.join("\n"));
  fd.set("description", form.description);
  fd.set("sizes", form.sizes.join(","));
  fd.set("isNew", form.isNew ? "true" : "false");
  fd.set("isBestSeller", form.isBestSeller ? "true" : "false");

  const stock: Record<string, number> = {};
  for (const size of form.sizes) {
    const raw = form.stockBySize[size];
    if (raw !== undefined && raw !== "") stock[size] = Math.max(0, Number(raw) || 0);
  }
  fd.set("stockBySize", JSON.stringify(stock));
  return fd;
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
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const products = initialProducts;
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.variant.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q) ||
      (p.productCode ?? "").toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function notify(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openAdd() {
    setForm(emptyProductForm);
    setEditingId(null);
    setModalMode("add");
  }

  function openEdit(p: StoreProduct) {
    setForm(productToForm(p));
    setEditingId(p.id);
    setModalMode("edit");
  }

  function close() {
    setModalMode(null);
    setEditingId(null);
    setForm(emptyProductForm);
  }

  function submit() {
    const fd = formToFormData(form);
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

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${
            message.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {!dbConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Base de données non configurée. Renseignez <code className="font-mono">DATABASE_URL</code> pour activer
          l&apos;ajout/modification. Les produits affichés proviennent du catalogue statique.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} produit{products.length !== 1 ? "s" : ""}
          </p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Nom, marque, code, couleur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="flex gap-2">
          {[{ value: "all", label: "Tous" }, ...CATEGORIES].map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === c.value
                  ? "bg-gray-900 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 border-b">
                <th className="px-6 py-3">Produit</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Genre</th>
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {p.brand ? `${p.brand} ` : ""}{p.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {p.variant} · {p.color}
                            {p.productCode ? ` · ${p.productCode}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {categoryLabel(p.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{genderLabel(p.gender)}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{p.price},00 $</td>
                    <td className="px-6 py-4 text-sm">
                      {p.category === "accessoires" ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={totalStock === 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                          {totalStock} u.
                        </span>
                      )}
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

      {/* Modal with the dynamic form */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold">
                {modalMode === "add" ? "Nouveau produit" : "Modifier le produit"}
              </h2>
              <button type="button" onClick={close} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <ProductForm value={form} onChange={setForm} mode={modalMode} />
            </div>

            <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={close}
                className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Enregistrement…" : modalMode === "add" ? "Créer le produit" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
