import type { Metadata } from "next";
import Link from "next/link";
import { getActivePromotions } from "@/lib/data/promotions-public";
import { storeSettings } from "@/lib/commerce/settings";

export const metadata: Metadata = {
  title: "Promotions",
  description: "Codes promo et offres en cours chez TDSSNEAKERS.",
};

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const promos = await getActivePromotions();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-[60vh]">
      <nav className="text-sm text-gray-500 mb-5 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <span>/</span>
        <span className="text-gray-900">Promotions</span>
      </nav>

      <h1 className="text-3xl font-black text-gray-900">PROMOTIONS</h1>
      <p className="text-gray-600 mt-2">
        Codes à saisir à l&apos;étape du paiement.
      </p>

      {promos.length === 0 ? (
        <div className="mt-8 bg-gray-50 border rounded-xl p-8 text-center">
          <p className="text-gray-600">
            Aucun code promo actif en ce moment. Revenez bientôt !
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {promos.map((p) => (
            <div
              key={p.code}
              className="border-2 border-dashed border-gray-300 rounded-xl p-5 bg-white"
            >
              <p className="text-2xl font-black tracking-wider text-gray-900 font-mono">
                {p.code}
              </p>
              <p className="text-primary font-bold mt-1">
                {p.type === "percentage"
                  ? `-${p.value} % sur votre commande`
                  : `-${p.value} $ CAD sur votre commande`}
              </p>
              <ul className="text-xs text-gray-500 mt-3 space-y-0.5">
                {p.minSubtotal > 0 && <li>Dès {p.minSubtotal} $ d&apos;achat</li>}
                {p.expiresAt && <li>Valide jusqu&apos;au {p.expiresAt}</li>}
                {!p.expiresAt && p.minSubtotal === 0 && <li>Sans minimum d&apos;achat</li>}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Always-on offer */}
      <div className="mt-8 bg-dark text-white rounded-xl p-6">
        <p className="text-xs uppercase tracking-wide text-gray-400">Offre permanente</p>
        <p className="text-xl font-black mt-1">
          Livraison gratuite dès {storeSettings.freeShippingThreshold} $ CAD
        </p>
        <p className="text-sm text-gray-300 mt-1">
          Appliquée automatiquement, aucun code nécessaire.
        </p>
      </div>

      <div className="mt-10 pt-6 border-t">
        <Link
          href="/boutique"
          className="inline-block bg-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
        >
          Magasiner maintenant
        </Link>
      </div>
    </div>
  );
}
