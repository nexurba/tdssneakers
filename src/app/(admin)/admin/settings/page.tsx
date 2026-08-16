"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("TDSSNEAKERS");
  const [storeEmail, setStoreEmail] = useState("contact@tdssneakers.ca");
  const [currency, setCurrency] = useState("CAD");
  const [shippingFee, setShippingFee] = useState("15");
  const [freeShippingMin, setFreeShippingMin] = useState("150");
  const [taxRate, setTaxRate] = useState("14.975");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration de votre boutique</p>
      </div>

      {/* General */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <h2 className="font-bold text-gray-900">Informations générales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
              <input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Tax */}
        <div className="bg-white rounded-xl border p-6 space-y-5">
          <h2 className="font-bold text-gray-900">Livraison & Taxes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="CAD">CAD ($)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais livraison ($)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livraison gratuite dès ($)</label>
              <input
                type="number"
                value={freeShippingMin}
                onChange={(e) => setFreeShippingMin(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Taux de taxe (%)</label>
            <input
              type="number"
              step="0.001"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">TPS + TVQ pour le Québec</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Notifications</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary accent-primary rounded" />
            <span className="text-sm">Email de confirmation de commande au client</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary accent-primary rounded" />
            <span className="text-sm">Notification admin pour nouvelles commandes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary accent-primary rounded" />
            <span className="text-sm">Email d&apos;expédition au client</span>
          </label>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Sauvegarder les modifications
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegardé!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
