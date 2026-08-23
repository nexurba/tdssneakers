"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Logo from "./Logo";

const SHOP_LINKS = [
  { href: "/boutique?cat=sneakers", label: "SNEAKERS" },
  { href: "/boutique?cat=vetements", label: "VÊTEMENTS" },
  { href: "/boutique?cat=accessoires", label: "ACCESSOIRES" },
  { href: "/boutique?new=true", label: "NOUVEAUTÉS" },
  { href: "/promotions", label: "PROMOTIONS" },
];

const INFO_LINKS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/livraison", label: "Livraison & retours" },
  { href: "/faq", label: "FAQ & tailles" },
  { href: "/suivi-commande", label: "Suivi de commande" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { openCart, totalItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read the query string from the browser rather than useSearchParams(),
  // which would force every page out of static prerendering.
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(window.location.search);
  }, [pathname]);

  // Close overlays whenever the route changes (covers back/forward too).
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname, query]);

  // Escape closes whichever overlay is open.
  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, searchOpen]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Subtle shadow once the page is scrolled, so the sticky bar reads as raised.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  /** Highlights the entry matching the current path *and* query string. */
  function isActive(href: string): boolean {
    const [path, hrefQuery] = href.split("?");
    if (path !== pathname) return false;
    if (!hrefQuery) return true;
    const [key, val] = hrefQuery.split("=");
    return new URLSearchParams(query).get(key) === val;
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setSearchOpen(false);
    setTerm("");
    router.push(`/recherche?q=${encodeURIComponent(q)}`);
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0" aria-label="TDSSNEAKERS — accueil">
          <Logo width={150} priority className="h-auto w-[110px] sm:w-[150px]" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-5">
          <Link
            href="/"
            className={`text-[13px] font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-gray-800"
            }`}
          >
            ACCUEIL
          </Link>
          {SHOP_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-[13px] font-medium transition-colors hover:text-primary whitespace-nowrap ${
                isActive(link.href)
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Infos dropdown groups the secondary pages */}
          <div className="relative group">
            <button
              className={`text-[13px] font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                INFO_LINKS.some((l) => l.href === pathname)
                  ? "text-primary"
                  : "text-gray-800"
              }`}
              aria-haspopup="true"
            >
              INFOS
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
              <div className="bg-white border rounded-lg shadow-lg py-2 min-w-[13rem]">
                {INFO_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-2 text-sm hover:bg-gray-50 ${
                      pathname === link.href ? "text-primary font-medium" : "text-gray-700"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Inline search (expands in place instead of navigating away) */}
          <form onSubmit={submitSearch} className="flex items-center">
            <div
              className={`overflow-hidden transition-all duration-200 ${
                searchOpen ? "w-36 sm:w-56 opacity-100 mr-1" : "w-0 opacity-0"
              }`}
            >
              <input
                ref={searchInputRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Rechercher…"
                aria-label="Rechercher un produit"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type={searchOpen ? "submit" : "button"}
              onClick={() => {
                if (!searchOpen) setSearchOpen(true);
              }}
              className="p-2 hover:text-primary transition-colors"
              aria-label={searchOpen ? "Lancer la recherche" : "Ouvrir la recherche"}
              aria-expanded={searchOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Order tracking (there is no customer login yet) */}
          <Link
            href="/suivi-commande"
            className="hidden sm:block p-2 hover:text-primary transition-colors"
            aria-label="Suivi de commande"
            title="Suivi de commande"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className="p-2 hover:text-primary transition-colors relative"
            aria-label={`Panier${totalItems > 0 ? ` — ${totalItems} article(s)` : " — vide"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu: grouped, scrollable, closes on navigation */}
      {menuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-[var(--header-h,64px)] bg-black/30"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu"
            className="lg:hidden relative bg-white border-t max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="px-4 py-4">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm font-semibold ${
                  pathname === "/" ? "text-primary" : "text-gray-900"
                }`}
              >
                ACCUEIL
              </Link>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-4 mb-1">
                Boutique
              </p>
              {SHOP_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-sm font-medium ${
                    isActive(link.href) ? "text-primary" : "text-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-4 mb-1">
                Informations
              </p>
              {INFO_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block py-2 text-sm ${
                    pathname === link.href ? "text-primary font-medium" : "text-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  openCart();
                }}
                className="mt-5 w-full bg-black text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                VOIR LE PANIER{totalItems > 0 ? ` (${totalItems})` : ""}
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
