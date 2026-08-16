"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center">
        {/* Left content */}
        <div className="relative z-10 md:w-1/2 text-white">
          <p className="text-primary font-semibold text-sm mb-2">WELCOME TO</p>
          <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tight">
            TDSSNEAKERS
          </h1>
          <p className="text-2xl md:text-3xl font-bold mb-4">
            SNEAKERS. <span className="italic text-primary">STYLE.</span> ATTITUDE.
          </p>
          <p className="text-gray-300 text-sm mb-8 max-w-md">
            Ta destination n°1 pour les sneakers et<br />
            vêtements sport & casual au Canada.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded font-bold text-sm hover:bg-primary-dark transition-colors"
          >
            SHOP NOW
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Right image area - sneaker photo */}
        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
          <div className="relative w-80 h-80 md:w-[420px] md:h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&h=800&fit=crop"
              alt="Sneaker collection"
              className="w-full h-full object-cover rounded-2xl shadow-2xl"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <span className="w-2 h-2 bg-primary rounded-full" />
        <span className="w-2 h-2 bg-gray-600 rounded-full" />
        <span className="w-2 h-2 bg-gray-600 rounded-full" />
        <span className="w-2 h-2 bg-gray-600 rounded-full" />
      </div>
    </section>
  );
}
