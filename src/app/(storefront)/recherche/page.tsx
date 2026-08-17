import Link from "next/link";
import { searchProducts } from "@/lib/data/products";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[60vh]">
      {/* Search form */}
      <form action="/recherche" method="get" className="mb-8 max-w-xl">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Rechercher un produit, une marque, une couleur..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            autoFocus
          />
        </div>
      </form>

      {query ? (
        <>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Résultats pour « {query} »
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {results.length} produit{results.length !== 1 ? "s" : ""} trouvé{results.length !== 1 ? "s" : ""}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">Aucun résultat.</p>
              <Link href="/boutique" className="text-primary font-medium hover:underline">
                Parcourir toute la boutique
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">Entrez un terme de recherche ci-dessus.</p>
      )}
    </div>
  );
}
