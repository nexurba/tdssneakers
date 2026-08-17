import Link from "next/link";
import CartClearer from "./CartClearer";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <CartClearer />
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Merci pour ta commande !</h1>
      <p className="text-gray-500 mb-8">
        Ton paiement a été confirmé. Un email de confirmation t&apos;a été envoyé.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/boutique" className="inline-block bg-black text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-800">
          Continuer mes achats
        </Link>
        <Link href="/" className="inline-block border border-gray-300 px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-50">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
