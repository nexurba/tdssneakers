"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeFromCart, updateQuantity, totalPrice } =
    useCart();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Votre Panier</h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            aria-label="Fermer le panier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-500 text-sm">Votre panier est vide</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.size}`}
                className="flex gap-4 bg-gray-50 rounded-lg p-3"
              >
                {/* Product image */}
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {item.variant} · Taille: {item.size}
                  </p>
                  <p className="text-sm font-bold mt-1">{item.price},00 $ CAD</p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.size, item.quantity - 1)
                      }
                      className="w-6 h-6 flex items-center justify-center border rounded text-xs hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.productId, item.size, item.quantity + 1)
                      }
                      className="w-6 h-6 flex items-center justify-center border rounded text-xs hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.productId, item.size)}
                  className="text-gray-400 hover:text-red-500 transition-colors self-start"
                  aria-label="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{totalPrice},00 $ CAD</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-black text-white py-3 rounded font-bold text-sm hover:bg-gray-800 transition-colors text-center"
            >
              PASSER LA COMMANDE
            </Link>
            <button
              onClick={closeCart}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </>
  );
}
