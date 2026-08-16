"use client";

import Link from "next/link";

export default function CategoryBanners() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sneakers Banner */}
          <div className="relative bg-dark rounded-lg overflow-hidden h-48 md:h-56 flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="relative z-10 p-8">
              <h3 className="text-3xl font-black text-white mb-2">SNEAKERS</h3>
              <p className="text-gray-300 text-sm mb-4">
                Découvre notre sélection<br />
                exclusive de sneakers.
              </p>
              <Link
                href="/boutique?cat=sneakers"
                className="inline-block bg-primary text-white px-6 py-2 rounded text-sm font-bold hover:bg-primary-dark transition-colors"
              >
                VOIR LES SNEAKERS
              </Link>
            </div>
            {/* Background pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-l from-gray-600 to-transparent" />
            </div>
          </div>

          {/* Vêtements Banner */}
          <div className="relative bg-dark rounded-lg overflow-hidden h-48 md:h-56 flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="relative z-10 p-8">
              <h3 className="text-3xl font-black text-white mb-2">VÊTEMENTS</h3>
              <p className="text-gray-300 text-sm mb-4">
                Styles sport, streetwear<br />
                et casual pour tous.
              </p>
              <Link
                href="/boutique?cat=vetements"
                className="inline-block bg-primary text-white px-6 py-2 rounded text-sm font-bold hover:bg-primary-dark transition-colors"
              >
                VOIR LES VÊTEMENTS
              </Link>
            </div>
            {/* Background pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-l from-gray-600 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
