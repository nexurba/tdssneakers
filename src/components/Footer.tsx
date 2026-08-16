"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-darker text-white">
      {/* Instagram CTA */}
      <div className="border-b border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-gray-400 uppercase mb-1">Suivez-nous</p>
          <h3 className="text-2xl md:text-3xl font-black mb-2">@TDSSNEAKERS</h3>
          <p className="text-sm text-gray-400 mb-4">
            Nouveautés, restocks, offres exclusives<br />
            et beaucoup plus sur Instagram!
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-white text-white px-4 py-2 text-xs font-bold hover:bg-white hover:text-black transition-colors"
          >
            NOUS SUIVRE
          </a>
        </div>
      </div>

      {/* Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo */}
          <div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-black text-xs text-center leading-tight">
                TDS<br/>SNEAKERS
              </span>
            </div>
          </div>

          {/* Boutique */}
          <div>
            <h4 className="font-bold text-sm mb-3">BOUTIQUE</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="/boutique?cat=sneakers" className="hover:text-white transition-colors">Sneakers</Link></li>
              <li><Link href="/boutique?cat=vetements" className="hover:text-white transition-colors">Vêtements</Link></li>
              <li><Link href="/boutique?new=true" className="hover:text-white transition-colors">Nouveautés</Link></li>
              <li><Link href="/boutique?promo=true" className="hover:text-white transition-colors">Promotions</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-bold text-sm mb-3">INFORMATIONS</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#" className="hover:text-white transition-colors">Livraison</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Retours & Remboursements</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Guide des tailles</Link></li>
            </ul>
          </div>

          {/* À propos */}
          <div>
            <h4 className="font-bold text-sm mb-3">À PROPOS</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link href="#" className="hover:text-white transition-colors">Notre histoire</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Suivi de commande</Link></li>
            </ul>
          </div>

          {/* Paiements & Social */}
          <div>
            <h4 className="font-bold text-sm mb-3">PAIEMENTS ACCEPTÉS</h4>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="bg-white/10 rounded px-2 py-1 text-[10px]">VISA</span>
              <span className="bg-white/10 rounded px-2 py-1 text-[10px]">MC</span>
              <span className="bg-white/10 rounded px-2 py-1 text-[10px]">AMEX</span>
              <span className="bg-white/10 rounded px-2 py-1 text-[10px]">APPLE</span>
            </div>
            <h4 className="font-bold text-sm mb-3">SUIVEZ-NOUS</h4>
            <div className="flex gap-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11V9.4a6.33 6.33 0 00-.82-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.41a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.15z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            © 2024 TDSSNEAKERS. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
