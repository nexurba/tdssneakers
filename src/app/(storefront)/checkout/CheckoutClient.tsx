"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { computeTotals } from "@/lib/commerce/settings";
import { createCheckoutAction, applyPromoAction } from "./actions";
import AddressFields, { emptyAddress, type AddressValue } from "./AddressFields";
import { formatPhone, isValidPhone, isValidPostalCode } from "@/lib/geo/types";

interface Contact {
  email: string;
  name: string;
  phone: string;
}

type FieldErrors = Partial<Record<keyof Contact, string>> & {
  address?: Partial<Record<keyof AddressValue, string>>;
};

export default function CheckoutClient({
  paymentAvailable,
  supportEmail,
}: {
  paymentAvailable: boolean;
  supportEmail: string;
}) {
  const { items, totalPrice } = useCart();
  const [isPending, startTransition] = useTransition();

  const [contact, setContact] = useState<Contact>({ email: "", name: "", phone: "" });
  const [address, setAddress] = useState<AddressValue>(emptyAddress);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => computeTotals(totalPrice, discount),
    [totalPrice, discount]
  );

  /** Validates every field up front so nothing fails only on the server. */
  function validate(): boolean {
    const next: FieldErrors = {};
    const addr: Partial<Record<keyof AddressValue, string>> = {};

    if (!contact.email.trim()) next.email = "Courriel requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      next.email = "Courriel invalide";
    }
    if (!contact.name.trim()) next.name = "Nom requis";

    if (!contact.phone.trim()) next.phone = "Téléphone requis";
    else if (!isValidPhone(contact.phone)) {
      next.phone = "Numéro à 10 chiffres, ex. (514) 555-0142";
    }

    if (!address.line1.trim()) addr.line1 = "Adresse requise";
    if (!address.city.trim()) addr.city = "Ville requise";
    if (!address.province) addr.province = "Province requise";
    if (!address.postalCode.trim()) addr.postalCode = "Code postal requis";
    else if (!isValidPostalCode(address.postalCode)) {
      addr.postalCode = "Format attendu : H2X 1K4";
    }

    if (Object.keys(addr).length > 0) next.address = addr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function applyPromo() {
    if (!promoCode.trim()) return;
    startTransition(async () => {
      const res = await applyPromoAction(promoCode, totalPrice);
      if (res.ok && res.discount !== undefined) {
        setDiscount(res.discount);
        setPromoMsg(`Code appliqué : -${res.discount.toFixed(2)} $`);
      } else {
        setDiscount(0);
        setPromoMsg(res.error ?? "Code invalide");
      }
    });
  }

  function pay() {
    setError(null);
    if (!validate()) return;

    startTransition(async () => {
      const res = await createCheckoutAction({
        email: contact.email.trim(),
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        address: {
          line1: address.line1.trim(),
          line2: address.line2.trim() || undefined,
          city: address.city.trim(),
          province: address.province,
          postalCode: address.postalCode.trim(),
          country: address.country,
          latitude: address.latitude ?? undefined,
          longitude: address.longitude ?? undefined,
          validated: address.validated,
          source: address.source ?? undefined,
        },
        promoCode: discount > 0 ? promoCode : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
        })),
      });
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error ?? "Erreur lors du paiement.");
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-gray-900 mb-3">Votre panier est vide</h1>
        <Link href="/boutique" className="inline-block bg-black text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-800">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 mb-8">Commande</h1>

      {!paymentAvailable && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="font-bold text-amber-900 text-sm">
            Paiement en ligne momentanément indisponible
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Votre panier est conservé. Réessayez dans quelques minutes, ou
            écrivez-nous à{" "}
            <a href={`mailto:${supportEmail}`} className="underline font-medium">
              {supportEmail}
            </a>{" "}
            et nous finalisons la commande avec vous.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact + delivery */}
        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="font-bold text-gray-900">Coordonnées</h2>

            <div>
              <label htmlFor="co-email" className="block text-sm font-medium text-gray-700 mb-1">
                Courriel <span className="text-red-500">*</span>
              </label>
              <input
                id="co-email"
                type="email"
                autoComplete="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                placeholder="vous@email.com"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.email ? (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">
                  Pour la confirmation et le suivi de commande.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="co-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                id="co-name"
                type="text"
                autoComplete="name"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                placeholder="Jean Tremblay"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="co-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                id="co-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                onBlur={() =>
                  contact.phone &&
                  isValidPhone(contact.phone) &&
                  setContact({ ...contact, phone: formatPhone(contact.phone) })
                }
                placeholder="(514) 555-0142"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.phone ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.phone ? (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1">
                  Le transporteur peut vous joindre à la livraison.
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-bold text-gray-900">Adresse de livraison</h2>
            <AddressFields
              value={address}
              onChange={setAddress}
              errors={errors.address ?? {}}
            />
          </section>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3"
            >
              {error}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-bold text-gray-900 mb-4">Récapitulatif</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Taille {item.size} · Qté {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">
                  {(item.price * item.quantity).toFixed(2)} $
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Code promo"
              aria-label="Code promo"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={isPending}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              Appliquer
            </button>
          </div>
          {promoMsg && (
            <p className={`text-xs mb-3 ${discount > 0 ? "text-green-600" : "text-red-500"}`}>
              {promoMsg}
            </p>
          )}

          <div className="space-y-2 border-t pt-4 text-sm">
            <Row label="Sous-total" value={totals.subtotal} />
            {totals.discount > 0 && <Row label="Réduction" value={-totals.discount} highlight />}
            <Row label="Livraison" value={totals.shipping} note={totals.shipping === 0 ? "Gratuite" : undefined} />
            <Row label="Taxes (TPS+TVQ)" value={totals.tax} />
            <div className="flex justify-between items-center pt-2 border-t font-bold text-base">
              <span>Total</span>
              <span>{totals.total.toFixed(2)} $ CAD</span>
            </div>
          </div>

          <button
            type="button"
            onClick={pay}
            disabled={isPending || !paymentAvailable}
            className="mt-6 w-full bg-black text-white py-4 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {!paymentAvailable
              ? "PAIEMENT INDISPONIBLE"
              : isPending
                ? "Traitement..."
                : "PAYER"}
          </button>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            {paymentAvailable
              ? "Paiement sécurisé"
              : "Aucun montant ne sera débité"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: number;
  note?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className={highlight ? "text-green-600 font-medium" : "text-gray-900"}>
        {note ?? `${value.toFixed(2)} $`}
      </span>
    </div>
  );
}
